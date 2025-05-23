import { useState, useEffect } from "react";
import Nav from "./Nav";
import Sidebar from "./Sidebar";
import Board from "./Board";
import { fetchMyBoards } from "../api/boards";
import { fetchLists, updateList } from "../api/lists";
import { fetchCards } from "../api/cards";

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
      const boardsArr = await fetchMyBoards();

      boardsArr.sort((a, b) => Number(a.position) - Number(b.position));

      const boardsLookup = {};
      const boardOrderLocal = boardsArr.map((b) => {
        const id = String(b.id);
        boardsLookup[id] = { boardID: id, title: b.name, listIds: [] };
        return id;
      });

      // 2) fetch lists per board
      const listsLookup = {};
      for (const boardId of boardOrderLocal) {
        let listsArr = [];
        try {
          listsArr = await fetchLists(boardId);
          listsArr.sort((a, b) => Number(a.position) - Number(b.position));
        } catch (err) {
          console.error(`Error fetching lists for board ${boardId}:`, err);
        }

        for (const l of listsArr) {
          const lid = String(l.id);
          listsLookup[lid] = {
            id: lid,
            title: l.title,
            cardIds: [],
            position: l.position,
            columnPos: l.columnPos,
            color: l.color,
            boardId: String(l.boardId),
          };
          boardsLookup[boardId].listIds.push(lid);
        }
      }

      for (const boardId of boardOrderLocal) {
        // Determine max column index from existing lists
        const colIndices = boardsLookup[boardId].listIds.map((lid) =>
          Number(listsLookup[lid].columnPos ?? 0)
        );
        const maxIdx = colIndices.length ? Math.max(...colIndices) : 0;

        // Seed cols with empty buckets for 0..maxIdx
        const cols = {};
        for (let i = 0; i <= maxIdx; i++) {
          cols[`col-${i}`] = { id: `col-${i}`, listIds: [] };
        }

        // Group lists into their respective column buckets
        boardsLookup[boardId].listIds.forEach((lid) => {
          const colIdx = Number(listsLookup[lid].columnPos ?? 0);
          cols[`col-${colIdx}`].listIds.push(lid);
        });

        // Sort each column's listIds by position
        // Reset each list's position to its index within the column (0-based)
        Object.values(cols).forEach((col) => {
          col.listIds.forEach((lid, idx) => {
            listsLookup[lid].position = idx;
          });
        });

        // Build columnOrder in ascending numeric order
        const columnOrder = Object.keys(cols).sort(
          (a, b) =>
            Number(a.replace("col-", "")) - Number(b.replace("col-", ""))
        );

        boardsLookup[boardId].columns = cols;
        boardsLookup[boardId].columnOrder = columnOrder;
      }

      // 3) fetch cards per list
      const cardsLookup = {};
      for (const listId of Object.keys(listsLookup)) {
        let cardsArr = [];
        try {
          const { boardId } = listsLookup[listId];
          cardsArr = await fetchCards(boardId, listId);
          cardsArr.sort((a, b) => Number(a.position) - Number(b.position));
        } catch (err) {
          console.error(`Error fetching cards for list ${listId}:`, err);
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

  const updateListColor = async (listId, newColor) => {
    setData((prev) => ({
      ...prev,
      lists: {
        ...prev.lists,
        [listId]: {
          ...prev.lists[listId],
          color: newColor,
        },
      },
    }));

    try {
      await updateList(selectedBoardId, Number(listId), { color: newColor });
    } catch (err) {
      console.error("Failed to save color:", err);
      setData((prev) => ({
        ...prev,
        lists: {
          ...prev.lists,
          [listId]: {
            ...prev.lists[listId],
            color: prev.lists[listId].color,
          },
        },
      }));
    }
  };

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
