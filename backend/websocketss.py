from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from typing import Dict, Optional
import json

from sqlmodel import Session, select

from models.OrderItem import OrderItem
from sql import get_session

router = APIRouter(prefix="/ws", tags=["WebSockets"])


class ConnectionManager:
    def __init__(self):
        # Hangi masada (ticket_id), hangi misafirlerin (guest_id) bağlı olduğunu tutar
        # Yapı: { ticket_id: { guest_id: WebSocket_Nesnesi } }
        self.active_connections: Dict[int, Dict[str, WebSocket]] = {}

    async def connect(self, websocket: WebSocket, ticket_id: int, guest_id: str):
        await websocket.accept()
        if ticket_id not in self.active_connections:
            self.active_connections[ticket_id] = {}

        self.active_connections[ticket_id][guest_id] = websocket

    def disconnect(self, ticket_id: int, guest_id: str):
        if ticket_id in self.active_connections:
            if guest_id in self.active_connections[ticket_id]:
                del self.active_connections[ticket_id][guest_id]
            # Masa boşaldıysa odayı temizle
            if not self.active_connections[ticket_id]:
                del self.active_connections[ticket_id]

    async def broadcast_to_room(
        self, ticket_id: int, message: dict, exclude_guest_id: Optional[str] = None
    ):
        """Masadaki herkese (eylemi yapan kişi hariç) mesaj gönderir."""
        print(
            f"📢 BROADCAST ÇAĞRILDI. Ticket: {ticket_id}, Hariç tutulan: {exclude_guest_id}"
        )
        print(f"Aktif odalar ve bağlantılar: {self.active_connections}")

        if ticket_id in self.active_connections:
            for gid, connection in self.active_connections[ticket_id].items():
                print(
                    f"-> Kontrol ediliyor: gid={gid} (Hariç tutulacak mı? {gid == exclude_guest_id})"
                )
                if gid != exclude_guest_id:
                    print(f"-> MESAJ GÖNDERİLİYOR -> Hedef Guest ID: {gid}")
                    await connection.send_json(message)
        else:
            print(
                f"❌ HATA: {ticket_id} numaralı ticket için aktif bağlantı odası bulunamadı!"
            )

    async def send_personal_message(
        self, ticket_id: int, target_guest_id: str, message: dict
    ):
        """Sadece hedeflenen tek bir kişiye mesaj gönderir. (Saldırı/Uyarı bildirimleri için)"""
        if ticket_id in self.active_connections:
            if target_guest_id in self.active_connections[ticket_id]:
                await self.active_connections[ticket_id][target_guest_id].send_json(
                    message
                )

    async def disconnect_all(self):
        """Forcefully closes all active websocket connections across all tables."""
        for ticket_id in list(self.active_connections.keys()):
            for guest_id, websocket in list(self.active_connections[ticket_id].items()):
                try:
                    await websocket.close()
                except Exception:
                    pass  # Connection might already be dropped
        self.active_connections.clear()

    async def force_disconnect_guest(self, ticket_id: int, guest_id: str):
        """Forcefully disconnects a guest and notifies the room."""
        if ticket_id in self.active_connections:
            if guest_id in self.active_connections[ticket_id]:
                websocket = self.active_connections[ticket_id][guest_id]

                # Close the websocket connection
                try:
                    await websocket.close()
                except Exception:
                    pass  # Connection might already be closed

                # Remove from active connections
                del self.active_connections[ticket_id][guest_id]

                # Clean up empty rooms
                if not self.active_connections[ticket_id]:
                    del self.active_connections[ticket_id]
                else:
                    # Notify remaining guests to update their UI
                    await self.broadcast_to_room(
                        ticket_id=ticket_id,
                        message={"type": "DISCONNECT", "guest_id": guest_id},
                    )


manager = ConnectionManager()


@router.websocket("/{ticket_id}/{guest_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    ticket_id: int,
    guest_id: str,
    session: Session = Depends(get_session),
):
    await manager.connect(websocket, ticket_id, guest_id)
    try:
        while True:
            # Frontend'den gelen mesajı dinle
            data = await websocket.receive_text()
            message = json.loads(data)
            msg_type = message.get("type")

            if msg_type == "ACTION":
                # Birisi ekranda bir butona tıkladı. Bunu odadaki diğer herkese canlı olarak yansıt.
                await manager.broadcast_to_room(
                    ticket_id=ticket_id,
                    message={
                        "type": "ACTION",
                        "guest_id": guest_id,
                        "guest_name": message.get("guest_name"),
                        "color": message.get("color"),
                        "target": message.get("target"),
                    },
                    exclude_guest_id=guest_id,  # Hareketi yapan kişiye kendi hareketini geri gönderme
                )

            elif msg_type == "ATTACK":
                # Birisi senin kilitli ürününe tıkladı. Sadece sana özel bir uyarı (Toast) fırlat.
                target_id = message.get("target_guest")
                attacker_name = message.get("attacker_name")

                await manager.send_personal_message(
                    ticket_id=ticket_id,
                    target_guest_id=target_id,
                    message={
                        "type": "ATTACK",
                        "attacker_name": attacker_name,
                        "product_name": message.get("product_name"),
                    },
                )

            # --- YENİ EKLENEN KISIMLAR: OYUN MODU KONSENSÜS ---
            elif msg_type == "CONSENT_REQUEST":
                print(
                    f"🎮 CONSENT_REQUEST GELDİ! Gönderen: {message.get('requesterName')} (Guest ID: {guest_id}, Ticket: {ticket_id})"
                )
                await manager.broadcast_to_room(
                    ticket_id=ticket_id,
                    message={
                        "type": "CONSENT_REQUEST",
                        "requesterName": message.get("requesterName"),
                        "targetMode": message.get("targetMode"),
                    },
                    exclude_guest_id=guest_id,
                )

            elif msg_type == "CONSENT_RESPONSE":
                # Birisi gelen isteğe "Kabul" veya "Red" cevabı verdi.
                # Şimdilik oybirliği kontrolü yerine basit bir sistem kuruyoruz:
                # Eğer vote "true" ise (kabul edildiyse) herkese "Oyun Modu Değişti" mesajını yay.
                vote_result = message.get("vote")
                if vote_result is True:
                    await manager.broadcast_to_room(
                        ticket_id=ticket_id,
                        message={
                            "type": "CONSENT_RESULT",
                            "success": True,
                            "targetMode": message.get("targetMode"),
                        },
                        exclude_guest_id=None,  # Sonuç herkese (istek yapan dahil) gitmeli ki UI değişsin
                    )

    except WebSocketDisconnect:
        manager.disconnect(ticket_id, guest_id)

        # 1. Unlock items in DB when tab is closed
        locked_items = session.exec(
            select(OrderItem).where(
                OrderItem.ticket_id == ticket_id,
                OrderItem.locked_by_session_id == guest_id,
                OrderItem.is_paid == False,
            )
        ).all()
        for item in locked_items:
            item.locked_by_session_id = None
            item.locked_by_name = None
        session.commit()

        # 2. Tell the room this guest left and they should refresh items
        await manager.broadcast_to_room(
            ticket_id, {"type": "DISCONNECT", "guest_id": guest_id}
        )
        await manager.broadcast_to_room(ticket_id, {"type": "REFRESH_ITEMS"})
