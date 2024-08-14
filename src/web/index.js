import React from "react";
import { createRoot } from "react-dom/client";

const App = () => {
  const [paths, setPaths] = React.useState([[]]);
  return (
    <div>
      <h1>Sketch Search</h1>
      <button
        onClick={async () => {
          await window.sketchSearch.uploadReference();
          console.log("Uploaded");
        }}
      >
        Upload
      </button>
      <button
        onClick={async () => {
          const [filePath, keypoints, neighbors] =
            await window.sketchSearch.search();
          console.log(neighbors);
          setPaths(neighbors);
        }}
      >
        Search
      </button>
      {paths.map((person) => {
        return person.map((neighbor) => {
          return <img key={neighbor} src={`file://${neighbor}`} />;
        });
      })}
    </div>
  );
};

const container = document.getElementById("app");
const root = createRoot(container);
root.render(<App />);
