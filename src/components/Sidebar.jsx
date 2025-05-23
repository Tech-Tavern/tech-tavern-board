import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Sidebar({
  boards,
  boardOrder,
  selected,
  onSelect,
  isOpen,
  onToggle,
}) {
  return (
    <aside
      className={`
        bg-indigo-100 h-screen p-2 overflow-y-auto
        transition-all duration-300 ease-in-out  
        ${isOpen ? "w-64" : "w-16"}
      `}
    >
      <div className="flex items-center justify-between mb-4 px-2">
        {isOpen && <h2 className="text-xl font-bold">Boards</h2>}
        <button
          onClick={onToggle}
          className="p-1 hover:bg-indigo-300 rounded"
          title={isOpen ? "Collapse" : "Expand"}
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {isOpen && <hr className="mb-4" />}

      <ul className="space-y-2">
        {boardOrder.map((boardId) => {
          const { title } = boards[boardId];
          const isActive = boardId === selected;
          return (
            <li key={boardId}>
              <button
                onClick={() => onSelect(boardId)}
                className={`
                  w-full flex items-center 
                  px-2 py-1 rounded transition-colors
                  ${
                    isActive
                      ? "bg-indigo-500 text-white"
                      : "hover:bg-indigo-300 text-gray-800"
                  }
                `}
              >
                <span className="flex-none w-8 text-center font-medium">
                  {boards[boardId].title.charAt(0)}
                </span>
                {isOpen && <span className="ml-2 truncate">{title}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
