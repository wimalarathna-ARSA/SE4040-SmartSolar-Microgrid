// Custom glowing pin icon for Solar Microgrid hubs
const solarHubIcon = L.divIcon({
  className: 'solar-hub-map-marker',
  html: `
    <div style="
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
      box-shadow: 0 0 16px rgba(22, 163, 74, 0.7),
                  0 4px 10px rgba(0,0,0,0.3);
      border: 2.5px solid #ffffff;
      color: #ffffff;
      font-size: 18px;
      cursor: grab;
      transform: translate(-50%, -50%);
    ">
      <i class="bi bi-geo-alt-fill"></i>
    </div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -20],
});

// Sri Lanka regional presets
const SRI_LANKA_PRESETS = [
  {
    name: 'Colombo Central',
    lat: 6.9271,
    lng: 79.8612,
    label: 'Colombo',
  },
  {
    name: 'Kandy Highland',
    lat: 7.2906,
    lng: 80.6337,
    label: 'Kandy',
  },
  {
    name: 'Galle Coastal',
    lat: 6.0535,
    lng: 80.2210,
    label: 'Galle',
  },
  {
    name: 'Jaffna Peninsula',
    lat: 9.6615,
    lng: 80.0255,
    label: 'Jaffna',
  },
  {
    name: 'Negombo Coastal',
    lat: 7.2008,
    lng: 79.8737,
    label: 'Negombo',
  },
  {
    name: 'Trincomalee Bay',
    lat: 8.5874,
    lng: 81.2152,
    label: 'Trincomalee',
  },
  {
    name: 'Hambantota Solar Zone',
    lat: 6.1429,
    lng: 81.1212,
    label: 'Hambantota',
  },
  {
    name: 'Kurunegala Grid',
    lat: 7.4863,
    lng: 80.3623,
    label: 'Kurunegala',
  },
];