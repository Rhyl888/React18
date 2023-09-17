import { createRoot } from "react-dom/client";

function FunctionComponent() {
  return (
    <h1
      onClick={() => console.log(`ParentBubble`)}
      onClickCapture={() => console.log(`ParentCapture`)}
    >
      <span
        onClick={() => console.log(`ChildBubble`)}
        onClickCapture={() => console.log(`ChildBubble`)}
      >
        world
      </span>
    </h1>
  );
}
let element = <FunctionComponent />;
const root = createRoot(document.getElementById("root"));

root.render(element);
