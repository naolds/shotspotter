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
  // Leaflet Properties
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  private map!: L.Map
  clickedCoord: L.LatLng | null = null;
  marker: L.Marker | null = null;

  // Google Street View API Properties
  streetViewImage: string | null = null;
  heading: number = 0;

  constructor(private streetViewService: StreetViewService) {}

  // Get Leaflet Map Properties and Prepare for Generation
  private initMap() : void {
    this.map = L.map(this.mapContainer.nativeElement).setView([40.7128, -74.0060], 13); // NYC

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
    }).addTo(this.map);

    setTimeout(() => {
      this.map.invalidateSize();
    }, 500);
  }

  // AfterViewInit: Generate Leaflet Map and Add Leaflet Listener to 'clicl' event
  ngAfterViewInit(): void {
    this.initMap();
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.marker?.remove();
      this.streetViewImage = null;
      
      this.clickedCoord = e.latlng;
      
      this.streetViewService.getStreetViewImage(e.latlng.lat, e.latlng.lng, 0)
        .subscribe({
          next: (imageBlob: Blob) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              this.streetViewImage = reader.result as string;
              
              this.marker = L.marker(e.latlng).addTo(this.map)
                .bindPopup(this.createPopupContent(), {
                  maxWidth: 800, 
                  maxHeight: 800
                })
                .openPopup();
                
              // Have to bind click event this way since the button is generated in Leaflet popup content
              setTimeout(() => {
                const rotateButton = document.querySelector('.rotate-button');
                rotateButton.addEventListener('click', () => this.handleRotate());
              }, 100);
            };
            reader.readAsDataURL(imageBlob);
          },
          error: (err) => {
            console.error('Error:', err);
          }
        });
    });
  }

  // Rotate image in popup
  handleRotate(): void {
    this.heading = (this.heading + 90) % 360;

    this.streetViewService.getStreetViewImage(this.clickedCoord.lat, this.clickedCoord.lng, this.heading)
      .subscribe({
        next: (imageBlob: Blob) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            this.streetViewImage = reader.result as string;
            
            this.marker.getPopup().setContent(this.createPopupContent());
            
            setTimeout(() => {
              const rotateButton = document.querySelector('.rotate-button');
              rotateButton.addEventListener('click', () => this.handleRotate());
            }, 100);
          };
          reader.readAsDataURL(imageBlob);
        },
        error: (err) => {
          console.error('Error:', err);
        }
      });
  }

  // Populate elements inside Leaflet marker popup
  private createPopupContent(): string {
    return `
      <div style="width:640px; max-width:100%; text-align:center;">
        ${this.streetViewImage ? 
          `<img src="${this.streetViewImage}" alt="Street View" style="width:100%; 
              max-width:100%; height:auto; object-fit:cover;">` : 
          '<p>No Street View image available</p>'
        }
        <button class="rotate-button">Rotate</button>
      </div>
    `;
  }
}