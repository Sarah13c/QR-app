import { Component } from '@angular/core';
import * as Leaflet from 'leaflet';
import { Polyline, LatLngExpression } from 'leaflet';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss']
})
export class Tab3Page {
  map: Leaflet.Map = {} as Leaflet.Map;
  markers: any[] = [];
  filterOptions: string[] = [];
  selectedFilter: string = 'Todos'; 
  markerIcon: any; 

  constructor(private storage: Storage) {}

  async ionViewDidEnter() {
    await this.storage.create();
    this.getStorageData();

    this.map = new Leaflet.Map('mapId3').setView([3.4372, -76.5225], 16);

    Leaflet.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
      attribution: 'edupala.com'
    }).addTo(this.map);

    this.markerIcon = Leaflet.icon({
      iconUrl: 'https://w7.pngwing.com/pngs/995/841/png-transparent-pin-location-map-icon.png',
      iconSize: [30, 30],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    });
  }

  async getStorageData() {
    let scanHistory: { data: string; latitude?: number; longitude?: number, date?: string, time?: string }[] = (await this.storage.get('scanHistory')) || [];
    if (scanHistory.length > 0) {
      const uniqueOptions: Map<string, { latitude: number, longitude: number }[]> = new Map();
  
      scanHistory.forEach((scan: any) => {
        if (!uniqueOptions.has(scan.data)) {
          uniqueOptions.set(scan.data, []);
        }
        uniqueOptions.get(scan.data)?.push({ latitude: scan.latitude || 0, longitude: scan.longitude || 0 });
      });

      this.filterOptions = Array.from(uniqueOptions.keys());

      this.markers = [];
      uniqueOptions.forEach((locations, code) => {
        this.markers.push(...locations.map(location => ({
          lat: location.latitude,
          long: location.longitude,
          city: code,
          date: scanHistory.find(scan => scan.data === code)?.date,
          time: scanHistory.find(scan => scan.data === code)?.time
        })));
      });
  
      this.filterMarkers(); 
    } else {
      this.markers = [];
      this.filterOptions = [];
    }
  }
  
  leafletMap() {
    for (const marker of this.markers) {
      const popupContent = `
        <b>Link: ${marker.city}</b><br>
        Fecha: ${marker.date}<br>
        Hora: ${marker.time}
      `;
  
      Leaflet.marker([marker.lat, marker.long], { icon: this.markerIcon }).addTo(this.map)
        .bindPopup(popupContent)
        .openPopup();
    }
    this.drawTrackingLines();
  }

  drawTrackingLines() {
    for (let i = 0; i < this.markers.length - 1; i++) {
      const startPoint: LatLngExpression = [this.markers[i].lat, this.markers[i].long];
      const endPoint: LatLngExpression = [this.markers[i + 1].lat, this.markers[i + 1].long];
      
      // Calculate intermediate points (you can use any logic here)
      const intermediatePoints: LatLngExpression[] = [
        startPoint,
        [(startPoint[0] + endPoint[0]) / 2, (startPoint[1] + endPoint[1]) / 2],
        endPoint
      ];

      const polyline = new Polyline(intermediatePoints, {
        color: 'blue', // color of the line
        weight: 3, // weight of the line
        opacity: 0.5, // opacity of the line
        smoothFactor: 1 // smoothness of the line
      }).addTo(this.map);
    }
  }

  filterMarkers(event?: any) {
    if (event) {
      this.selectedFilter = event.target.value;
    }

    this.map.eachLayer(layer => {
      if (layer instanceof Leaflet.Marker) {
        this.map.removeLayer(layer);
      }
    });

    let filteredMarkers = [];
    if (this.selectedFilter === 'Todos') {
      filteredMarkers = this.markers;
    } else {
      filteredMarkers = this.markers.filter(marker => marker.city === this.selectedFilter);
    }

    for (const marker of filteredMarkers) {
      const popupContent = `
        <b>Link: ${marker.city}</b><br>
        Fecha: ${marker.date}<br>
        Hora: ${marker.time}
      `;
      Leaflet.marker([marker.lat, marker.long], { icon: this.markerIcon }).addTo(this.map)
        .bindPopup(popupContent)
        .openPopup();
    }
    this.drawTrackingLines(); // Redraw tracking lines after filtering
  }
}
