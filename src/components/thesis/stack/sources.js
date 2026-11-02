// Detail sheets for the eight source-dataset groups of Table 3.2 (thesis overview post).
// Every statement is either (a) stated in a published thesis post on this blog, or (b) taken from the
// producer's documentation or the dataset paper listed in `refs`. Product facts are kept to what those
// pages say; how the thesis used a dataset is kept to what the posts say.

const doi = (d) => `https://doi.org/${d}`;

export const SOURCE_SHEETS = [
  {
    id: 'hotspots',
    name: 'Fire hotspots',
    col: '#e8533a',
    product: 'NASA FIRMS · MODIS active fire (Terra and Aqua)',
    role: 'Target variable',
    facts: [
      ['Sensor', 'MODIS on Terra (crosses the equator about 10:30 local solar time, descending) and Aqua (about 13:30, ascending); swath about 2,330 km'],
      ['Pixel', '1 km fire pixel; pixels grow toward the edge of the scan, which the scan and track fields record'],
      ['Location', 'Centre of the 1 km fire pixel, not necessarily the fire itself; one or more fires can sit inside one pixel'],
      ['Per detection', 'Date and UTC time, satellite (T/A), day or night, brightness temperature (channels 21/22 and 31, K), fire radiative power (MW), confidence 0–100%, type'],
      ['Confidence classes', 'Low below 30%, nominal 30–79%, high 80% and above (MODIS C6/C6.1 user guide)'],
      ['Type flag', '0 presumed vegetation fire, 1 active volcano, 2 other static land source, 3 offshore; available in the standard (MCD14ML) data only'],
      ['Collections used', '6.03 and 61.03'],
    ],
    how: [
      'The detection algorithm flags a pixel when its mid-infrared (about 4 µm) brightness temperature stands out from the thermal-infrared (about 11 µm) signal and from its non-fire neighbours. A heuristic confidence value is assembled from several sub-tests. Collection 6 added a rejection test for small tropical forest clearings.',
    ],
    thesis: [
      '205,215 FIRMS detections for Riau → 189,234 after keeping type 0 only (15,981 removed) → 33,759 in 2015–2024 → 5,386 inside Bengkalis → 3,402 kept by the confidence-anchored DBSCAN filter.',
      'Filter rule: detections at 70% confidence or more are anchors; 50–69% detections within 1.5 km of an anchor are kept as probable smouldering peat fires; the rest are dropped. The 70% anchor sits inside the product’s nominal class, not at its high-class boundary.',
      'Counted per sub-district and month to give the target of every model: the hotspot count and fire occurrence (at least one hotspot) in each of the 1,320 sub-district-months.',
    ],
    caveats: [
      'A hotspot is a proxy for fire, not burned area: in 2023 more than half of the Landsat-mapped burned area had no hotspot within 2 km.',
      'Positional uncertainty is about the size of the 1 km pixel, so distances of a few hundred metres (for example to a canal) are below the resolution of the data.',
      'The same fires count as 1,648 or 5,386 depending on the confidence cut-off. The filter is better read as one point in a sensitivity range.',
      'The anchor threshold and the 1.5 km rescue radius are defined for MODIS and would need recalibration for VIIRS (375 m).',
    ],
    posts: [['behind-the-numbers-hotspot-filtering-checks', 'How the hotspots were filtered'], ['hotspot-vs-burned-area-validation-bengkalis', 'Hotspots against burned area']],
    refs: [
      ['Giglio, Schroeder & Justice (2016). The Collection 6 MODIS active fire detection algorithm and fire products. Remote Sensing of Environment 178, 31–41.', doi('10.1016/j.rse.2016.02.054')],
      ['Giglio et al. (2021). MODIS Collection 6 and 6.1 Active Fire Product User’s Guide, v1.0.', 'https://lpdaac.usgs.gov/documents/1005/MOD14_User_Guide_V61.pdf'],
      ['NASA Earthdata. FIRMS: active fire data attributes (MODIS and VIIRS).', 'https://earthdata.nasa.gov/data/tools/firms/active-fire-data-attributes-modis-viirs'],
      ['NASA Dark Target. MODIS orbits and swath.', 'https://darktarget.gsfc.nasa.gov/satellite/modis'],
    ],
  },
  {
    id: 'rain',
    name: 'Precipitation',
    col: '#4f9be8',
    product: 'CHIRPS v2.0 · Climate Hazards Group InfraRed Precipitation with Station data',
    role: 'SPI-3, SPEI-3, predictor',
    facts: [
      ['Grid', '0.05° (about 5.5 km at the equator)'],
      ['Coverage', 'Quasi-global, 50°S–50°N, all longitudes'],
      ['Period', '1981 to near present; daily, pentad and monthly products'],
      ['Inputs', 'The CHPclim rainfall climatology, 0.05° satellite infrared imagery (cold-cloud duration) and in-situ station data'],
      ['Purpose stated by the producer', 'A gridded rainfall time series for trend analysis and seasonal drought monitoring'],
    ],
    how: [
      'Satellite infrared cold-cloud-duration estimates are combined with the CHPclim climatology, and the result is blended with available station observations.',
    ],
    thesis: [
      'Monthly rainfall per sub-district (the precip_mm column of the panel), used directly as a predictor.',
      'Input to SPI-3: three-month totals fitted with a gamma distribution separately for each calendar month on a 1991–2024 baseline (34 years, which meets the 30-year guidance), then converted to a standard-normal score.',
      'Rainfall minus potential evapotranspiration gives the water balance behind SPEI-3.',
      'SPI-3 correlates with monthly hotspots at ρ = −0.293 pooled, more strongly than ONI (ρ = +0.231), and more strongly than ONI in ten of the eleven sub-districts.',
    ],
    caveats: [
      'Not bias-corrected against local stations: the nearest BMKG station identified (Karimun, about 120 km away across the Strait of Malacca) was judged unrepresentative.',
      'The rainfall series itself is not part of the public data repository, so SPI-3 cannot be regenerated from the files on this page alone.',
      'The draft manuscript standardised SPI-3 on 2015–2024 only; values on this site use the 1991–2024 baseline and should not be compared with the draft.',
    ],
    posts: [['enso-spi3-peatland-fire-bengkalis', 'ENSO and SPI-3']],
    refs: [
      ['Funk et al. (2015). The climate hazards infrared precipitation with stations — a new environmental record for monitoring extremes. Scientific Data 2, 150066.', doi('10.1038/sdata.2015.66')],
      ['CHIRPS Version 2.0, Precipitation, Global, 0.05°, Monthly, 1981–present (catalog record).', 'https://catalog.data.gov/dataset/chirps-version-2-0-precipitation-global-0-05-monthly-1981-present'],
      ['Svoboda, Hayes & Wood (2012). Standardized Precipitation Index User Guide. WMO-No. 1090.', 'https://www.droughtmanagement.info/literature/WMO_standardized_precipitation_index_user_guide_ar_2012.pdf'],
    ],
  },
  {
    id: 'temp',
    name: 'Air temperature',
    col: '#f0bc2e',
    product: 'ERA5-Land monthly averaged · ECMWF / Copernicus Climate Change Service',
    role: 'PET, predictor',
    facts: [
      ['What it is', 'A land reanalysis produced by replaying the land component of the ECMWF ERA5 climate reanalysis at higher resolution'],
      ['Grid', '0.1° (about 9 km)'],
      ['Period', '1950 to about three months before real time'],
      ['Variable used', '2 m air temperature: air temperature 2 m above the surface, interpolated between the lowest model level and the surface; delivered in kelvin'],
    ],
    how: [
      'A land-surface model is driven by ERA5 atmospheric fields, which combine model output with observations worldwide. The monthly product averages the hourly fields.',
    ],
    thesis: [
      'Monthly mean 2 m temperature per sub-district (t2m_mean_c, °C) as a predictor.',
      'Potential evapotranspiration for SPEI-3 follows Thornthwaite, which needs monthly mean temperature and day length. The water balance is standardised per calendar month with a generalised extreme value distribution.',
    ],
    caveats: [
      'Values are grid-cell averages, so comparison with a single station needs care.',
      'As with rainfall, no bias correction against local stations was applied.',
    ],
    posts: [['enso-spi3-peatland-fire-bengkalis', 'ENSO and SPI-3'], ['climate-vs-everything-else-ablation-bengkalis', 'How much is climate?']],
    refs: [
      ['Muñoz-Sabater et al. (2021). ERA5-Land: a state-of-the-art global reanalysis dataset for land applications. Earth System Science Data 13(9), 4349–4383.', doi('10.5194/essd-13-4349-2021')],
      ['Google Earth Engine catalog: ERA5-Land Monthly Averaged.', 'https://developers.google.com/earth-engine/datasets/catalog/ECMWF_ERA5_LAND_MONTHLY'],
      ['Vicente-Serrano, Beguería & López-Moreno (2010). A multiscalar drought index sensitive to global warming: the SPEI. Journal of Climate 23(7), 1696–1718.', doi('10.1175/2009JCLI2909.1')],
    ],
  },
  {
    id: 'enso',
    name: 'ENSO, IOD',
    col: '#c084fc',
    product: 'Oceanic Niño Index (ONI) and Dipole Mode Index (DMI) · NOAA',
    role: 'Phase, predictor, confounder',
    facts: [
      ['ONI', 'Three-month running mean of ERSST.v5 sea-surface-temperature anomalies in the Niño 3.4 region (5°N–5°S, 120°–170°W), against centred 30-year base periods updated every 5 years'],
      ['ENSO episode rule (NOAA CPC)', 'Threshold of ±0.5 °C met for at least 5 consecutive overlapping seasons'],
      ['DMI (NOAA PSL)', 'Area-averaged HadISST1.1 SST anomaly of the western equatorial Indian Ocean (50°–70°E, 10°S–10°N) against the south-eastern equatorial Indian Ocean (90°–110°E, 10°S–0°), with the 1981–2010 monthly climatology removed'],
      ['Example', 'ONI (ERSST.v5) reached 2.8 °C in NDJ 2015; it was 0.9 °C in DJF 2019 and climbed to 2.1 °C by NDJ 2023'],
    ],
    how: [
      'Both indices are computed from gridded ocean temperature reconstructions, not from local observations. The IOD as a coupled ocean–atmosphere mode was described by Saji et al. (1999).',
    ],
    thesis: [
      'ONI downloaded from NOAA PSL in the thesis run. Months are El Niño or La Niña only inside a run of at least five consecutive months at or beyond ±0.5 °C: 44 El Niño, 30 La Niña and 46 Neutral months in 2015–2024.',
      'ONI enters as a predictor at lags of 0–6 months. A 1 °C rise is associated with a 1.95-fold increase in monthly hotspots (IRR 1.95, 95% CI 1.36–2.81), falling to 1.29 (0.98–1.69) once SPEI-3 is added: the ENSO effect runs largely through local drought.',
      'DMI is used as a confounder; the annual table gives June–November means of ONI and DMI against yearly hotspot totals.',
    ],
    caveats: [
      'The ONI series used differs from the draft manuscript’s by up to 0.19 °C.',
      'NOAA CPC now publishes ONI based on ERSST version 6 and uses the Relative Oceanic Niño Index (RONI) for official monitoring, so current CPC values may differ from the series used here.',
      '2019 combined a weak ENSO signal with a strong positive IOD, which is why ONI alone under-explains that season.',
    ],
    posts: [['enso-spi3-peatland-fire-bengkalis', 'ENSO and SPI-3'], ['early-warning-skill-bengkalis', 'Early-warning skill']],
    refs: [
      ['NOAA CPC. Cold and warm episodes by season (ONI, ERSST.v5).', 'https://cpc.ncep.noaa.gov/products/analysis_monitoring/enso/oni/v5/'],
      ['NOAA PSL. Dipole Mode Index (DMI).', 'https://psl.noaa.gov/gcos_wgsp/Timeseries/DMI/'],
      ['Huang et al. (2017). Extended Reconstructed Sea Surface Temperature, Version 5 (ERSSTv5). Journal of Climate 30(20), 8179–8205.', doi('10.1175/JCLI-D-16-0836.1')],
      ['Saji, Goswami, Vinayachandran & Yamagata (1999). A dipole mode in the tropical Indian Ocean. Nature 401, 360–363.', doi('10.1038/43854')],
      ['Iskandar et al. (2022). Extreme positive Indian Ocean Dipole in 2019 and its impact on Indonesia. Sustainability 14(22), 15155.', doi('10.3390/su142215155')],
    ],
  },
  {
    id: 'peat',
    name: 'Peat depth',
    col: '#2cc4a0',
    product: 'National peatland map, clipped to Bengkalis Regency',
    role: 'Depth, peat area',
    facts: [
      ['In Bengkalis', '208 polygons, 511,265 ha of mapped peat'],
      ['Depth classes', '50–<100, 100–<200, 200–<300, 300–<500, 500–<700 and ≥700 cm (D1–D6)'],
      ['National map (Anda et al. 2021)', 'Semi-detailed 1:50,000 mapping from satellite imagery, DEM/SRTM and field verification; 18,232 observations collected 2013–2019; 13.43 million ha of peat nationally, 5.85 million ha of it in Sumatra'],
    ],
    how: [
      'The national inventory delineates peat from imagery and terrain, and assigns depth classes from field observations. Its six classes are the ones used throughout the thesis.',
    ],
    thesis: [
      'Each hotspot is joined to the polygon it falls in, giving its depth class; 91.1% of the 3,402 hotspots fall on mapped peat.',
      'Peat area and a fire-weighted depth per sub-district enter the model as biophysical-static features.',
      'A goodness-of-fit test rejects the idea that fire is spread over depth classes in proportion to their area. The 500–700 cm class is over-represented by a ratio of 1.33.',
    ],
    caveats: [
      'An earlier draft computed area shares from all 4,070 national polygons instead of the peat inside Bengkalis, inflating the 500–700 cm ratio to 3.25. The corrected value is 1.33.',
      'Depth is a single snapshot; subsidence and burning since mapping are not reflected.',
      'Peat area and mean depth are correlated (+0.55) across the eleven sub-districts, so their effects cannot be separated.',
    ],
    posts: [['peat-depth-land-cover-bengkalis', 'Which peat burns?']],
    refs: [
      ['Anda et al. (2021). Revisiting tropical peatlands in Indonesia: semi-detailed mapping, extent and depth distribution assessment. Geoderma 402, 115235.', doi('10.1016/j.geoderma.2021.115235')],
    ],
  },
  {
    id: 'landuse',
    name: 'Land-use covariates',
    col: '#8fd96a',
    product: 'Oil palm, forest loss, surface water, population and NDVI trend',
    role: 'Static covariates',
    facts: [
      ['Oil palm (Descals et al. 2024)', 'Industrial and smallholder oil palm at 10 m from Sentinel-1 radar with a convolutional neural network (2016–2021), plus a 30 m planting-year layer from Landsat (1990–2021). Producer’s/user’s accuracy 91.0/91.8% for industrial and 71.4/72.4% for smallholder plantations'],
      ['Forest loss (Hansen et al. 2013)', 'Landsat-based, about 30 m. Tree cover is canopy closure of vegetation taller than 5 m in 2000; loss is a stand-replacing disturbance, with the year of loss recorded per pixel'],
      ['Surface water (Pekel et al. 2016)', 'JRC Global Surface Water, 30 m, from 4.7 million Landsat 5/7/8 scenes (1984–2021); occurrence is the share of observations in which water was present'],
      ['Population', 'Population density per km² by sub-district, from BPS statistics'],
      ['NDVI trend', 'Trend in vegetation greenness from Landsat and Sentinel-2'],
    ],
    how: [
      'Each layer is reduced to one value per sub-district: fraction of the area under oil palm, fraction deforested in 2015–2024, mean water occurrence, population density and NDVI trend.',
    ],
    thesis: [
      'Four of these are the anthropogenic feature group of the model (oil-palm fraction, deforestation fraction 2015–2024, population density, NDVI trend); surface-water occurrence is in the biophysical-static group.',
      'Oil palm is highest inland in Pinggir (0.58), Mandau (0.56) and Bathin Solapan (0.46), lowest in Bantan (0.06) and Rupat (0.08). Forest loss in 2015–2024 was largest in Siak Kecil (12,183 ha), Talang Muandau (9,537 ha) and Rupat (8,593 ha).',
      'In the SHAP decomposition, anthropogenic features carry 22% of the model’s weight, against 59% for climate.',
    ],
    caveats: [
      'Each variable has only eleven distinct values and does not change over time, so it cannot say which months burn; within a sub-district its AUC is exactly 0.5 by construction.',
      'Forest loss and oil palm correlate negatively with hotspots. That mostly encodes the contrast between peat-dominated island sub-districts and drier inland ones with plantations, not a protective effect.',
      'The layers are tangled: oil palm with NDVI trend (+0.81), forest loss with peat area (−0.67).',
    ],
    posts: [['peat-depth-land-cover-bengkalis', 'Which peat burns?'], ['climate-vs-everything-else-ablation-bengkalis', 'How much is climate?']],
    refs: [
      ['Descals et al. (2024). Global mapping of oil palm planting year from 1990 to 2021. Earth System Science Data 16(11), 5111–5129.', doi('10.5194/essd-16-5111-2024')],
      ['Hansen et al. (2013). High-resolution global maps of 21st-century forest cover change. Science 342, 850–853.', doi('10.1126/science.1244693')],
      ['Pekel, Cottam, Gorelick & Belward (2016). High-resolution mapping of global surface water and its long-term changes. Nature 540, 418–422.', doi('10.1038/nature20584')],
      ['Google Earth Engine catalog: Hansen Global Forest Change.', 'https://developers.google.com/earth-engine/datasets/catalog/UMD_hansen_global_forest_change_2023_v1_11'],
    ],
  },
  {
    id: 'burned',
    name: 'Burned area',
    col: '#f28f3b',
    product: 'MODIS MCD64A1 (500 m) and Landsat dNBR / dATBI (30 m)',
    role: 'Proxy validation',
    facts: [
      ['MCD64A1 Collection 6.1', 'Monthly, global, 500 m, from November 2000. Each cell gets an approximate burn day of year and an uncertainty'],
      ['MCD64A1 method', 'Combines 500 m surface reflectance with 1 km active-fire observations; a burn-sensitive index from shortwave-infrared bands 5 and 7 plus a temporal-texture measure, with dynamic thresholds'],
      ['dNBR', 'NBR = (NIR − SWIR) / (NIR + SWIR); dNBR = NBR before the fire minus NBR after'],
      ['dATBI (Bilal 2025)', 'ATBI = NBR × (SWIR / NIR); a pixel is mapped as burned when ATBI drops by 0.20 or more between pre- and post-fire images'],
    ],
    how: [
      'The thesis runs both Landsat indices on Collection 2 Level-2 surface reflectance. The paper used a different atmospheric correction (SREM) whose code was not released.',
    ],
    thesis: [
      'Check 1, MCD64A1: 0.67 of burned sub-district-months also contain a hotspot (0.83 with one month of slack), but only 0.33 of hotspot months contain a burned 500 m pixel. Annual hotspots and burned hectares correlate at ρ = 0.72 over 110 sub-district-years.',
      'Check 2, Landsat dATBI for 2015, 2019 and 2023: in the big years 73–82% of the burned area lay within 1 km of a hotspot, 8–11 times more than chance; in 2023 only 46%.',
      'Each hotspot is compared with matched control points on peat in the same sub-district and month, so what is reported is a difference in hit-rate, not a raw hit-rate.',
    ],
    caveats: [
      'MCD64A1 uses active fires as an input (44% of burned cells coincide with an active fire on the same day, 68% within two days), so agreement shows consistency, not independent confirmation.',
      'The MCD64 user guide summarises global validation at 72.6% omission and 40.2% commission. Small fires are the weak spot, and the small fire year 2023 shows it.',
    ],
    posts: [['hotspot-vs-burned-area-validation-bengkalis', 'Hotspots against burned area']],
    refs: [
      ['Giglio, Boschetti, Roy, Humber & Justice (2018). The Collection 6 MODIS burned area mapping algorithm and product. Remote Sensing of Environment 217, 72–85.', doi('10.1016/j.rse.2018.08.005')],
      ['NASA LP DAAC. MCD64 User Guide, Collection 6.1.', 'https://lpdaac.usgs.gov/documents/1006/MCD64_User_Guide_V61.pdf'],
      ['Google Earth Engine catalog: MCD64A1.061 MODIS Burned Area Monthly Global 500 m.', 'https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MCD64A1'],
      ['Key & Benson (2006). Landscape assessment: the Composite Burn Index and the Normalized Burn Ratio. USDA Forest Service RMRS-GTR-164-CD.', 'https://www.usgs.gov/publications/landscape-assessment-ground-measure-severity-composite-burn-index-and-remote-sensing'],
      ['Bilal (2025). The automated temporal burn index (ATBI) for accurate and scalable burned area mapping. International Journal of Applied Earth Observation and Geoinformation 144, 104866.', doi('10.1016/j.jag.2025.104866')],
    ],
  },
  {
    id: 'canals',
    name: 'Land cover; canals',
    col: '#94a3b8',
    product: 'ESA WorldCover 10 m 2021 v200 · canal map of Dadap et al. (2021)',
    role: 'Canal analysis',
    facts: [
      ['WorldCover v200', '10 m global land cover for 2021 from Sentinel-1 and Sentinel-2; 11 classes (tree cover, shrubland, grassland, cropland, built-up, bare/sparse vegetation, snow and ice, permanent water, herbaceous wetland, mangroves, moss and lichen); overall accuracy 76.7% in independent validation'],
      ['Canal map', 'Drainage canals of Southeast Asian peatlands mapped from 2017 imagery (Dadap et al. 2021), rasterised for the thesis at 30 m and turned into distance to the nearest canal'],
      ['Regional context', 'Drainage affects at least 65% of Southeast Asian peatlands; intensively drained areas subside about 3.2 times faster than undrained ones (Dadap et al. 2021)'],
    ],
    how: [
      'For each hotspot on peat, the distance to the nearest mapped canal is read from the distance raster and compared with random points on peat matched on depth class.',
    ],
    thesis: [
      '3,100 hotspots on mapped peat against 30,001 random null points. Hotspots on non-forest peat sit significantly closer to canals than chance. The canal-distance logistic model gives an odds ratio of 0.74, and 0.77 (0.69–0.84) once WorldCover land cover is added.',
      'The excess is largest at 0.5–1 km (ratio 1.40). Nothing burns beyond 4 km, and the 2–4 km class holds 7.7% of the peat but under 1% of the hotspots.',
      'WorldCover defines burnable land (tree, shrub, grass, cropland, bare, herbaceous wetland); 3,098 of the 3,100 hotspots qualify.',
    ],
    caveats: [
      'The canal map labels some roads as canals, so "near a canal" also means "near a road": drainage and access cannot be separated.',
      'The 2017 map misses canals built and blocked afterwards, including restoration canal blocks.',
      'The landscape is densely cut: the median random point on peat is only about 209 m from a mapped line, below the roughly 1 km positional resolution of a hotspot.',
    ],
    posts: [['canals-fire-location-bengkalis', 'Canals and where fire falls']],
    refs: [
      ['Dadap et al. (2021). Drainage canals in Southeast Asian peatlands increase carbon emissions. AGU Advances 2(1), e2020AV000321.', doi('10.1029/2020AV000321')],
      ['Zanaga et al. (2022). ESA WorldCover 10 m 2021 v200.', doi('10.5281/zenodo.7254221')],
      ['ESA WorldCover 2021 (product site).', 'https://worldcover2021.esa.int'],
      ['Salmayenti, Baird, Holden & Spracklen (2025). Drainage density and land cover interact to affect fire occurrence in Indonesian peatlands. Environmental Research Letters 20(5), 054036.', doi('10.1088/1748-9326/adc755')],
    ],
  },
];
