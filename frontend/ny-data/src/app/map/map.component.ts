import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import { StreetViewService } from '../../services/streetview.service';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [HttpClientModule, CommonModule],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css'
})
export class MapComponent implements AfterViewInit{
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  private map!: L.Map
  clickedCoord: L.LatLng | null = null;
  marker: L.Marker | null = null;
  streetViewImage: string | null = null;
  errorMessage: string | null = null;

  constructor(private streetViewService: StreetViewService) {}

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

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.marker?.remove();
      this.streetViewImage = null;
      this.errorMessage = null;
      
      this.streetViewService.getStreetViewImage(e.latlng.lat, e.latlng.lng)
        .subscribe({
          next: (imageBlob) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              this.streetViewImage = reader.result as string;
              
              this.marker = L.marker(e.latlng).addTo(this.map)
                .bindPopup(this.createPopupContent(e.latlng), {
                  maxWidth: 800, 
                  maxHeight: 800
                })
                .openPopup();
            };
            reader.readAsDataURL(imageBlob);
          },
          error: (err) => {
            console.error('Error:', err);
            this.errorMessage = `Error fetching Street View: ${err.message}`;

          }
        });
    });
  }

  private createPopupContent(latlng: L.LatLng): string {
    return `
      <div style="width:640px; max-width:100%; text-align:center;">
        ${this.streetViewImage ? 
          `<img src="${this.streetViewImage}" alt="Street View" style="width:100%; 
              max-width:100%; height:auto; object-fit:cover;">` : 
          '<p>No Street View image available</p>'
        }
      </div>
    `;
  }
}
