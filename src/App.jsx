import { useState } from "react";
import "./index.css";
import Nav from "./components/Nav";
import Board from "./components/Board";
import initialData from "./data/initialData";

export default function App() {
  const [data, setData] = useState(initialData);
  const updateListColor = (listId, newColor) => {
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
  };
  return (
    <>
      <Nav />
      <main className="">
        {data.boardOrder.map((id) => (
          <div key={id} className="h-screen">
            
            <Board
              boardId={id}
              data={data}
              setData={setData}
              updateListColor={updateListColor}
            />
          </div>
        ))}
      </main>
    </>
  );
}
