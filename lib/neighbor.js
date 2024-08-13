const HierachicalNSW = require("hnswlib-node");

const NUMDIM = 34;

function createNeighborGraph(keypoints) {
  const index = new HierachicalNSW("l2", NUMDIM);
  const elements = keypoints.length;
  index.initIndex(elements);

  for (let i = 0; i < elements; i++) {
    const point = keypoints[i];
    index.addDataPoint(point, i);
  }

  index.writeIndex("index.dat");
}

function findNeighbors(target_keypoints, references) {
  /*
   * target_keypoints: A list of keypoints for the target image
   * references: A dictionary of file paths and their corresponding keypoints. Keypoints are stored in a list.
   */
  const pathDistance = {};
  const sortedPaths = [];
  console.log("Target keypoints: ", target_keypoints);
  console.log("References: ", references);

  return new Promise((resolve, reject) => {
    // For each keypoint in the target image (There might be multiple people in the image)
    for (const target_keypoint of target_keypoints) {
      // For each file path in the references
      for (const filePath in references) {
        pathDistance[filePath] = Math.pow(10, 1000);

        // For each keypoint in the reference image (There might be multiple people in the reference image )
        for (const keypoint of references[filePath]) {
          let distance = Math.sqrt(
            keypoint
              .map((x, index) => Math.pow(x - target_keypoint[index], 2))
              .reduce((a, b) => a + b, 0),
          );
          const distance_fliped = Math.sqrt(
            keypoint
              .map((x, index) => {
                if (index % 2 == 1) x = 100 - x;
                return Math.pow(x - target_keypoint[index], 2);
              })
              .reduce((a, b) => a + b, 0),
          );
          if (distance > distance_fliped) distance = distance_fliped;
          console.log("File Path: ", filePath);
          console.log("Distance: ", distance);

          // Store the most low distance for each file path
          pathDistance[filePath] = Math.min(distance, pathDistance[filePath]);
        }
      }
      // Create a sorted array of file paths for each person in the target image
      sortedPaths.push(
        Object.keys(pathDistance).sort(
          (a, b) => pathDistance[a] - pathDistance[b],
        ),
      );
    }
    console.log("Sorted paths: ", sortedPaths);
    resolve(sortedPaths);
  });
}

exports.createNeighborGraph = createNeighborGraph;
exports.findNeighbors = findNeighbors;
