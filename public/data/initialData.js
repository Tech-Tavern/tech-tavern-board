const initialData = {
  boards: {
    "board-1": {
      id: "board-1",
      title: "My First Board",
      listIds: ["list-1", "list-2", "list-3", "list-4"],
    },
  },
  lists: {
    "list-1": {
      id: "list-1",
      title: "To Do",
      cardIds: ["card-1"],
      color: "#D8B4FE",
    },
    "list-2": {
      id: "list-2",
      title: "Doing",
      cardIds: ["card-2"],
      color: "#D8B4FE",
    },
    "list-3": {
      id: "list-3",
      title: "Done",
      cardIds: ["card-3", "card-4"],
      color: "#D8B4FE",
    },
    "list-4": {
      id: "list-4",
      title: "Archived",
      cardIds: [],
      color: "#D8B4FE",
    },
  },
  cards: {
    "card-1": { id: "card-1", content: "Set up project repo" },
    "card-2": { id: "card-2", content: "Create initial components" },
    "card-3": { id: "card-3", content: "Implement drag and drop" },
    "card-4": { id: "card-4", content: "Add styling" },
  },
  boardOrder: ["board-1"],
};

export default initialData;
