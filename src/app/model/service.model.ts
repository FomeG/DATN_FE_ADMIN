export interface Service {
    id: string;
    serviceTypeID: string;
    imageUrl: string;
    serviceName: string;
    description: string;
    price: number;
  }
  
  export interface ServiceResponse {
    responseCode: number;
    message: string;
    data: Service[];
    totalRecord: number;
  }
  
  export interface CreateServiceRequest {
    serviceName: string;
    description: string;
    price: number;
    serviceTypeID: string;
    photo?: File;
  }
  
  export interface UpdateServiceRequest {
    id: string;
    serviceName: string;
    description: string;
    price: number;
    serviceTypeID: string;
    photo?: File;
  }