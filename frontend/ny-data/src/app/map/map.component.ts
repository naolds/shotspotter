import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css'
})
export class MapComponent implements AfterViewInit{
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  private map!: L.Map

  private initMap() : void {
    this.map = L.map(this.mapContainer.nativeElement).setView([40.7128, -74.0060], 13); // NYC

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
    }).addTo(this.map);

    setTimeout(() => {
      this.map.invalidateSize();
    }, 500);
  }

  ngAfterViewInit(): void {
      this.initMap();
  }
}
