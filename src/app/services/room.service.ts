import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Room {
    id: string;
    cinemaId: string;
    name: string;
    totalColNumber: number;
    totalRowNumber: number;
    totalSeats: number;
    roomCapacity: number;
    status: number;
}

export interface RoomResponse {
    data: Room[];
    message: string;
    responseCode: number;
    totalRecord: number;
}

@Injectable({
    providedIn: 'root'
})
export class RoomService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    getRooms(): Observable<RoomResponse> {
        return this.http.get<RoomResponse>(`${this.apiUrl}Room/GetListRooms`);
    }






}