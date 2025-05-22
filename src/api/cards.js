// src/api/cards.js
import { getAuth } from "firebase/auth";
const baseUrl = import.meta.env.VITE_BASE_URL;

async function getUidHeader() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return { "x-user-uid": user.uid };
}

export async function fetchCards(boardId, listId) {
  const headers = await getUidHeader();
  const res = await fetch(
    `${baseUrl}/boards/${boardId}/lists/${listId}/cards`,
    { headers }
  );
  if (!res.ok) throw new Error(`Could not fetch cards (${res.status})`);
  return res.json();
}

export async function createCard(boardId, listId, payload) {
  const headers = {
    "Content-Type": "application/json",
    ...(await getUidHeader()),
  };
  const res = await fetch(
    `${baseUrl}/boards/${boardId}/lists/${listId}/cards`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    }
  );
  if (!res.ok) throw new Error(`Could not create card (${res.status})`);
  return res.json();
}
