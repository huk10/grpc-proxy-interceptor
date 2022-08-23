import { type Status } from "@grpc/grpc-js/src/constants";
import { StatusCodes as httpStatus } from "http-status-codes";
export declare function httpStatus2GrpcStatus(code: httpStatus): Status;
