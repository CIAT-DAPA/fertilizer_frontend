import React from "react";

function LoadingReport() {
  const LoadCard = ({ minWidth, minHeight }) => {
    return (
      <div
        className="card col-12 col-lg-5 my-1"
        style={{ minWidth: minWidth, maxHeight: "434px" }}
      >
        <div className="card-body">
          <h5 className="card-title">
            <p class="placeholder-glow">
              <span class="placeholder col-2 bg-secondary" />
            </p>
          </h5>
          <p class="placeholder-glow">
            <span
              class="placeholder col-12 bg-secondary"
              style={{
                minHeight: minHeight,
              }}
            />
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
      <LoadCard minWidth="100%" minHeight="370px" />
      <LoadCard minWidth="49%" minHeight="312px" />
      <LoadCard minWidth="49%" minHeight="312px" />
      <LoadCard minWidth="100%" minHeight="330px" />
      <LoadCard minWidth="49%" minHeight="312px" />
      <LoadCard minWidth="49%" minHeight="312px" />
    </>
  );
}

export default LoadingReport;
