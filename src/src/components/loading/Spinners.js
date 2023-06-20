import React from "react";


const Spinners = () => {
    return (
        <div
            className="col-12 d-flex justify-content-evenly my-5"
            style={{ backgroundColor: "white" }}
            key={"spinners"}
        >
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
            <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
            <div className="spinner-border text-warning" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );
};

export default Spinners;