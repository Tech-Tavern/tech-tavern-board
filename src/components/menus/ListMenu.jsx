export default function ListMenu({
  x,
  y,
  updateListColor,
  id,
  color,
  onRename,
  onDelete,
  onAdd, // added prop
}) {
  return (
    <ul
      className="fixed z-50 w-40 bg-gradient-to-tl from-[#1a1c2b] via-[#23263a] to-[#2d3250] rounded-lg shadow-lg ring-2 ring-white ring-opacity-1 overflow-hidden text-md"
      style={{ top: y, left: x }}
    >
      {/* Color Picker */}
      <li className="px-3 py-2 hover:bg-gray-100 flex items-center gap-2 text-white hover:text-black">
        <input
          type="color"
          value={color}
          onChange={(e) => updateListColor(id, e.target.value)}
          aria-label="Pick list color"
          className="w-6 h-6 p-0 border-0 cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        />
        <span>Change Color</span>
      </li>

      <li className="border-t border-gray-100"></li>

      {/* Rename */}
      <li
        className="px-3 py-2 hover:bg-white cursor-pointer flex items-center gap-2 text-white hover:text-black"
        onClick={(e) => {
          e.stopPropagation();
          onRename(id);
        }}
      >
        <span>Rename List</span>
      </li>

      {/* Add List */}
      <li
        className="px-3 py-2 hover:bg-green-50 hover:text-green-600 cursor-pointer flex items-center gap-2 text-white"
        onClick={(e) => {
          e.stopPropagation();
          onAdd(id);
        }}
      >
        <span>Add List</span>
      </li>

      {/* Delete */}
      <li
        className="px-3 py-2 hover:bg-red-50 hover:text-red-600 cursor-pointer flex items-center gap-2 text-white"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(id);
        }}
      >
        <span>Delete List</span>
      </li>
    </ul>
  );
}
