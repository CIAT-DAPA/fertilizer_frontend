import React from "react";
import methodology from "../../assets/images/methodology.png";

function Methodology() {
  return (
    <main>
      <br />
      <div className="container">
        <section className="row">
          <div className="col-lg-12">
            <h2 className="text-center font-link">Methodology</h2>
            <h4 className="font-link">Overview</h4>
            <p className="font-link-body text-justify">
              The NextGen is a location-specific, tailored (suited to different farming systems and household typologies, and season-smart (aligned to an upcoming growing season) agroadvisory decision support tool (DST) designed to facilitate informed decision-making by different stakeholders. The advisory has been developed by integrating over 25,000 crop responses to fertilizer datasets with spatial co-variants using machine learning algorithms. The advisory and the partnership model between Excellence in Agronomy Initiative (EiA) under the leadership of the Alliance, GIZ-Ethiopia, Digital Green, and national institutes has attracted significant interest and preparations to scale are currently underway. The dataset, database management, and content (advisory) creation are supported and informed by the coalition of the wiling – teams of experts who came together to share data and/or facilitate the process. GIZ-Ethiopia and the Excellence in Agronomy (EiA) CGIAR Initiative are supporting the project.
            </p>
            <h4 className="font-link ps-3"> 1. Fertilizer</h4>
            <p className="font-link-body text-justify">
              The fertilizer data stored in the system consists of both elemental
              and compound fertilizer nutrients. It includes n, p, urea, nps,
              compost and vermi-compost. The output is produced based on machine
              learning algorithm.
            </p>
            <h4 className="font-link">Data and Data Sources</h4>
            <p className="font-link-body text-justify">
              In order to get fertilizer recommendation two categories of data
              were used. An observation data which consists of the fertilizer and
              treatment historical information collected, cleaned and harmonized
              by CoW (Coalition of the willing) and raster covariates available
              publicly were used. These includes:
            </p>
            <ol type="a">
              <li className="font-link-body text-justify">
                Soil data – these are raster covariates collected from soilgrids (
                <a href="https://soilgrids.org/" target="_blank">
                  soilgrids.org
                </a>
                ) which contains eleven soil property maps with three different
                depths (0-5cm, 5-15cm and 15-30cm)
              </li>
              <li className="font-link-body text-justify">
                Climate data – acquired from TerraClim (
                <a
                  href="https://www.climatologylab.org/terraclimate.html"
                  target="_blank"
                >
                  www.climatologylab.org/terraclimate.html
                </a>
                ) and consists of four different parameters (precipitation, solar
                radiation, min temperature and max temperature)
              </li>
              <li className="font-link-body text-justify">
                Topographic data – these category includes elevation, slope,
                topographic positioning index (tpi) and topographic ruggedness
                index (tri) collected from amazon web tile services.
              </li>
            </ol>

            <h4 className="font-link">Methodology</h4>

            <p className="font-link-body text-justify">
              After acquiring the data, first weighted average for the three soil
              depths was and a single raster file calculated for each soil
              nutrient was generated. Then slope, tpi and tri was calculated from
              the elevation data. Besides the climatic data for each month of the
              growing length was selected. Finally the values of these covariates
              were extracted by the observation data.
            </p>

            <p className="font-link-body text-justify">
              For model calibration, the covariates data extracted was cleaned and
              missing values were removed. Then 80 percent and 20 percent of the
              data was selected for model training and validation respectively. A
              random forest machine learning algorithm is used to calibrate the
              model. For the prediction to be done, first a prediction grid for
              the good, normal and bad year with 25 percent, 50 percent and 75
              percent quantiles respectively were prepared. Finally, the
              prediction was made based on the above three different scenarios.
              During the prediction an interaction matrix for different values of
              nitrogen and phosphorous was used; this produces a prediction of
              several different layer combinations. The optimal yield and the
              optimal n & p values were generated by selecting the optimal values
              from this combination of layers. In addition to generate a report
              based on the admin levels the average values of fertilizer
              recommendations were calculated by Kebele boundaries. Please see the
              workflow below. You can also see the R source code here at {" "}
              <a href="https://github.com/EthiopiaCiatGit/SCSFR" target="_blank">
                github
              </a>
            </p>
            <div className="d-flex justify-content-center my-4">
              <figure>
                <img alt="methodology" src={methodology} role="img" />
                <figcaption>
                  Fig 1. Fertilizer Workflow
                </figcaption>
              </figure>
              

            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Methodology;
