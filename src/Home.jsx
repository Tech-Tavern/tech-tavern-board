import { useState, useEffect } from "react";
import Nav from "./components/Nav";
import Sidebar from "./components/Sidebar";
import Board from "./components/Board";

export default function Home() {
  const [data, setData] = useState({
    boards: {},
    lists: {},
    cards: {},
    boardOrder: [],
  });
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    async function loadAll() {
      // 1) fetch boards
      const boardsRes = await fetch("http://localhost:4000/boards");
      if (!boardsRes.ok) throw new Error(`HTTP ${boardsRes.status}`);
      const boardsArr = await boardsRes.json();

      const boardsLookup = {};
      const boardOrderLocal = boardsArr.map((b) => {
        const id = String(b.id);
        boardsLookup[id] = { id, title: b.name, listIds: [] };
        return id;
      });

      // 2) fetch lists per board
      const listsLookup = {};
      for (const boardId of boardOrderLocal) {
        let listsArr = [];
        try {
          const res = await fetch(
            `http://localhost:4000/boards_${boardId}_lists`
          );
          if (res.ok) listsArr = await res.json();
        } catch {
          console.warn(`No lists for board ${boardId}`);
        }
        for (const l of listsArr) {
          const lid = String(l.id);
          listsLookup[lid] = {
            id: lid,
            title: l.title,
            cardIds: [],
            color: l.color,
            boardId: String(l.boardId),
          };
          boardsLookup[boardId].listIds.push(lid);
        }
      }

      // 3) fetch cards per list
      const cardsLookup = {};
      for (const listId of Object.keys(listsLookup)) {
        let cardsArr = [];
        try {
          const { boardId } = listsLookup[listId];
          const res = await fetch(
            `http://localhost:4000/boards_${boardId}_lists_${listId}_cards`
          );
          if (res.ok) cardsArr = await res.json();
        } catch {
          console.warn(`No cards for list ${listId}`);
        }
        for (const c of cardsArr) {
          const cid = String(c.id);
          cardsLookup[cid] = { id: cid, content: c.title, listId };
          listsLookup[listId].cardIds.push(cid);
        }
      }

      // commit data and initial selection
      setData({
        boards: boardsLookup,
        boardOrder: boardOrderLocal,
        lists: listsLookup,
        cards: cardsLookup,
      });
      setSelectedBoardId(boardOrderLocal[0] ?? null);
    }

    loadAll().catch(console.error);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen((open) => !open);

  const updateListColor = (listId, newColor) =>
    setData((prev) => ({
      ...prev,
      lists: {
        ...prev.lists,
        [listId]: { ...prev.lists[listId], color: newColor },
      },
    }));

  if (!selectedBoardId) {
    return (
      <>
        <Nav />
        <div className="flex">
          <Sidebar
            boards={data.boards}
            boardOrder={data.boardOrder}
            selected={selectedBoardId}
            onSelect={setSelectedBoardId}
            isOpen={isSidebarOpen}
            onToggle={toggleSidebar}
          />
          <main className="flex-1 p-4">Loading…</main>
        </div>
      </>
    );
  }

  return (
    <>
      <Nav />
      <div className="flex">
        <Sidebar
          boards={data.boards}
          boardOrder={data.boardOrder}
          selected={selectedBoardId}
          onSelect={setSelectedBoardId}
          isOpen={isSidebarOpen}
          onToggle={toggleSidebar}
        />
        <main className="flex-1 bg-gray-50 overflow-y-auto">
          <div className="h-screen">
            <Board
              boardId={selectedBoardId}
              data={data}
              setData={setData}
              updateListColor={updateListColor}
            />
          </div>
        </main>
      </div>
    </>
  );
}
