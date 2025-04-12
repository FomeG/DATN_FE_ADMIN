import { Component, OnInit, AfterViewInit, Input, Output, EventEmitter, ElementRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

@Component({
  selector: 'app-cinema-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cinema-map.component.html',
  styleUrl: './cinema-map.component.css'
})
export class CinemaMapComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  @Input() latitude: number = 10.8231; // Mặc định là Hồ Chí Minh
  @Input() longitude: number = 106.6297;
  @Input() editable: boolean = false;
  @Input() mapHeight: string = '500px'; // Cho phép điều chỉnh chiều cao của bản đồ
  @Output() locationChanged = new EventEmitter<{lat: number, lng: number}>();

  private map!: L.Map;
  private marker!: L.Marker;
  private isMapInitialized = false;
  private resizeObserver!: ResizeObserver;

  constructor() { }

  ngOnInit(): void {
    // Leaflet sẽ được khởi tạo trong ngAfterViewInit
    console.log('CinemaMap Init with position:', this.latitude, this.longitude);
  }

  ngAfterViewInit(): void {
    // Đảm bảo map container đã tồn tại trong DOM
    setTimeout(() => {
      this.initializeMap();
      
      // Thiết lập ResizeObserver để tự động điều chỉnh kích thước bản đồ khi container thay đổi
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => {
          if (this.map) {
            setTimeout(() => this.map.invalidateSize(), 200);
          }
        });
        
        if (this.mapContainer && this.mapContainer.nativeElement) {
          this.resizeObserver.observe(this.mapContainer.nativeElement);
        }
      }
      
      // Thêm sự kiện listener cho khi modal được hiển thị
      if (this.mapContainer && this.mapContainer.nativeElement) {
        const modalElement = this.findParentModal(this.mapContainer.nativeElement);
        if (modalElement) {
          modalElement.addEventListener('shown.bs.modal', () => {
            setTimeout(() => {
              if (this.map) {
                this.map.invalidateSize();
                this.map.setView([this.latitude, this.longitude], this.map.getZoom());
              }
            }, 500);
          });
        }
      }
    }, 300); // Tăng timeout để đảm bảo DOM đã render hoàn toàn
  }
  
  private findParentModal(element: HTMLElement): HTMLElement | null {
    let current = element;
    while (current && !current.classList.contains('modal')) {
      current = current.parentElement as HTMLElement;
      if (!current) return null;
    }
    return current;
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Cập nhật vị trí marker khi latitude/longitude thay đổi
    if ((changes['latitude'] || changes['longitude']) && this.isMapInitialized) {
      const lat = typeof this.latitude === 'string' ? parseFloat(this.latitude) : this.latitude;
      const lng = typeof this.longitude === 'string' ? parseFloat(this.longitude) : this.longitude;
      
      this.updateMarkerPosition(lat, lng);
      console.log('Marker position updated:', lat, lng);
    }
    
    // Cập nhật chiều cao của bản đồ nếu mapHeight thay đổi
    if (changes['mapHeight'] && this.mapContainer) {
      this.mapContainer.nativeElement.style.height = this.mapHeight;
      if (this.map) {
        setTimeout(() => this.map.invalidateSize(), 200);
      }
    }
  }

  private initializeMap(): void {
    if (!this.mapContainer || this.isMapInitialized) return;

    try {
      console.log('Initializing map at:', this.latitude, this.longitude);
      
      // Cập nhật chiều cao cho container nếu mapHeight được chỉ định
      if (this.mapHeight) {
        this.mapContainer.nativeElement.style.height = this.mapHeight;
      }
      
      // Chuyển đổi chuỗi sang số nếu cần
      const lat = typeof this.latitude === 'string' ? parseFloat(this.latitude) : this.latitude;
      const lng = typeof this.longitude === 'string' ? parseFloat(this.longitude) : this.longitude;
      
      // Kiểm tra tính hợp lệ của tọa độ
      if (isNaN(lat) || isNaN(lng)) {
        console.error('Invalid coordinates:', this.latitude, this.longitude);
        // Sử dụng tọa độ mặc định nếu tọa độ không hợp lệ
        this.latitude = 10.8231;
        this.longitude = 106.6297;
      }

      // Khởi tạo bản đồ Leaflet
      this.map = L.map(this.mapContainer.nativeElement, {
        center: [lat, lng],
        zoom: 15,
        maxZoom: 19,
        minZoom: 3
      });
      
      // Thêm layer bản đồ OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.map);

      // Tạo icon cho marker
      let markerIcon;
      try {
        // Định nghĩa đường dẫn tới các icon Leaflet
        L.Icon.Default.prototype.options.imagePath = 'assets/media/';
        
        // Sử dụng icon mặc định của Leaflet
        markerIcon = new L.Icon.Default();
      } catch (err) {
        console.warn('Không thể tạo icon, sử dụng dạng marker mặc định:', err);
        markerIcon = undefined; // Leaflet sẽ dùng marker mặc định
      }

      // Tạo marker
      this.marker = L.marker([lat, lng], {
        draggable: this.editable,
        icon: markerIcon
      }).addTo(this.map);

      // Thêm popup cho marker
      this.marker.bindPopup("<b>Vị trí rạp phim</b>").openPopup();

      // Nếu cho phép chỉnh sửa, thêm sự kiện khi kéo thả marker
      if (this.editable) {
        this.marker.on('dragend', () => {
          const position = this.marker.getLatLng();
          console.log('Marker dragged to:', position);
          
          // Phát sự kiện với tọa độ mới
          this.locationChanged.emit({ 
            lat: parseFloat(position.lat.toFixed(6)), 
            lng: parseFloat(position.lng.toFixed(6)) 
          });
        });

        // Cho phép click vào bản đồ để di chuyển marker
        this.map.on('click', (event) => {
          const latlng = event.latlng;
          this.marker.setLatLng(latlng);
          console.log('Map clicked at:', latlng);
          
          // Phát sự kiện với tọa độ mới
          this.locationChanged.emit({ 
            lat: parseFloat(latlng.lat.toFixed(6)), 
            lng: parseFloat(latlng.lng.toFixed(6)) 
          });
        });
      }

      // Đánh dấu là đã khởi tạo
      this.isMapInitialized = true;
      
      // Buộc cập nhật kích thước bản đồ
      setTimeout(() => {
        this.map.invalidateSize();
      }, 500);
      
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  // Phương thức để cập nhật vị trí marker từ bên ngoài
  updateMarkerPosition(lat: number, lng: number): void {
    if (!this.map || !this.marker) return;
    
    try {
      console.log('Updating marker to:', lat, lng);
      const newLatLng = L.latLng(lat, lng);
      this.marker.setLatLng(newLatLng);
      this.map.setView(newLatLng, this.map.getZoom());
    } catch (error) {
      console.error('Error updating marker position:', error);
    }
  }
  
  // Phương thức công khai để trigger invalidateSize
  refreshMap(): void {
    if (this.map) {
      setTimeout(() => this.map.invalidateSize(), 200);
    }
  }
  
  // Phóng to bản đồ
  zoomIn(): void {
    if (this.map) {
      this.map.zoomIn();
    }
  }
  
  // Thu nhỏ bản đồ
  zoomOut(): void {
    if (this.map) {
      this.map.zoomOut();
    }
  }
  
  ngOnDestroy(): void {
    // Dọn dẹp ResizeObserver khi component bị hủy
    if (this.resizeObserver && this.mapContainer && this.mapContainer.nativeElement) {
      this.resizeObserver.unobserve(this.mapContainer.nativeElement);
      this.resizeObserver.disconnect();
    }
  }
}
