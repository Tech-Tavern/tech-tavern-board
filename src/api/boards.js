import { getAuth } from "firebase/auth";
const baseUrl = import.meta.env.VITE_BASE_URL;

async function getUidHeader() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return { "x-user-uid": user.uid };
}

export async function fetchBoards() {
  const headers = await getUidHeader();
  const res = await fetch(`${baseUrl}/boards`, { headers });
  if (!res.ok) throw new Error(`Could not fetch boards (${res.status})`);
  return res.json();
}

export async function fetchMyBoards(){
    const headers = await getUidHeader();
    const res = await fetch(`${baseUrl}/boards/my`, { headers });
    if (!res.ok) throw new Error(`Could not fetch boards (${res.status})`);
    return res.json();
}

export async function createBoard(payload) {
  const headers = {
    "Content-Type": "application/json",
    ...(await getUidHeader()),
  };
  const res = await fetch(`${baseUrl}/boards`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Could not create board (${res.status})`);
  return res.json();
}
