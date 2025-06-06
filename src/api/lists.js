import { getAuth } from "firebase/auth";
const baseUrl = import.meta.env.VITE_BASE_URL;

async function getUidHeader() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return { "x-user-uid": user.uid };
}

export async function fetchLists(boardId) {
  const headers = await getUidHeader();
  const res = await fetch(`${baseUrl}/boards/${boardId}/lists`, { headers });
  if (!res.ok) throw new Error(`Could not fetch lists (${res.status})`);
  return res.json();
}

export async function createListApi(boardId, payload) {
  const headers = {
    "Content-Type": "application/json",
    ...(await getUidHeader()),
  };
  const res = await fetch(`${baseUrl}/boards/${boardId}/lists`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Could not create list (${res.status})`);
  return res.json();
}

export async function updateListApi(boardId, listId, payload) {
  const headers = {
    "Content-Type": "application/json",
    ...(await getUidHeader()),
  };
  const res = await fetch(`${baseUrl}/boards/${boardId}/lists/${listId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Could not update list (${res.status})`);
  return res.json();
}

export async function deleteListApi(boardId, listId) {
  const headers = {
    ...(await getUidHeader()),
  };

  const res = await fetch(`${baseUrl}/boards/${boardId}/lists/${listId}`, {
    method: "DELETE",
    headers,
  });

  if (!res.ok) {
    throw new Error(`Could not delete list (${res.status})`);
  }

  return;
}
