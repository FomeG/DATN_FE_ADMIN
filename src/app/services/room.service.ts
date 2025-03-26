import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { NumberSymbol } from '@angular/common';

export interface RoomType {
    roomTypeId: string;
    name: string;
    status: number;
}

export interface Room {
    id: string;
    cinemaId: string;
    roomTypeId: string;
    name: string;
    totalColNumber: number;
    totalRowNumber: number;
    totalSeats: number;
    seatPrice: bigint;
    isdeleted: boolean;
    status: number;
}

export interface RoomResponse {
    responseCode: number;
    message: string;
    data: Room[];
    totalRecord: number;
}

export interface RoomTypeResponse {
    responseCode: number;
    message: string;
    data: RoomType[];
    totalRecord: number;
}

@Injectable({
    providedIn: 'root'
})
export class RoomService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    getRooms(currentPage: number, recordPerPage: Number): Observable<RoomResponse> {
        return this.http.get<RoomResponse>(`${this.apiUrl}Room/GetAllRoom?currentPage=${currentPage}&recordPerPage=${recordPerPage}`);
    }

    getRoomTypes(currentPage: number, recordPerPage: Number): Observable<RoomTypeResponse> {
        return this.http.get<RoomTypeResponse>(`${this.apiUrl}RoomType/GetListRoomType?currentPage=${currentPage}&recordPerPage=${recordPerPage}`);
    }

    deleteRoom(id: string): Observable<any> {
        return this.http.post(`${this.apiUrl}Room/DeleteRoom?RoomId=${id}`, {});
    }

    createRoom(room: {
        cinemaId: string;
        name: string;
        totalColNumber: number;
        totalRowNumber: number;
        seatPrice: number;
    }): Observable<any> {
        return this.http.post(`${this.apiUrl}Room/CreateRoom`, room);
    }

    updateRoom(room: {
        id: string;
        roomTypeId: string;
        name: string;
        seatPrice: number;
        status: number;
    }): Observable<any> {
        return this.http.post(`${this.apiUrl}Room/UpdateRoom`, room);
    }
}