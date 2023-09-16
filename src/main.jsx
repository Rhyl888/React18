import { createRoot } from "react-dom/client";

function FunctionComponent() {
  return (
    <h1
      onClick={() => console.log(`父冒泡`)}
      onClickCapture={() => console.log(`父俘获`)}
    >
      <span
        onClick={() => console.log(`子冒泡`)}
        onClickCapture={() => console.log(`子俘获`)}
      >
        world
      </span>
    </h1>
  );
}
let element = <FunctionComponent />;
const root = createRoot(document.getElementById("root"));

root.render(element);
