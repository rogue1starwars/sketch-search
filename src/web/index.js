import React from "react";
import { createRoot } from "react-dom/client";
import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/css/image-gallery.css";

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
      <ImageGallery
        items={paths.flat().map((path) => {
          return {
            original: `file://${path}`,
            thumbnail: `file://${path}`,
          };
        })}
      />
      ;
    </div>
  );
};

const container = document.getElementById("app");
const root = createRoot(container);
root.render(<App />);
