import {status} from '@grpc/grpc-js'
import {type Status} from '@grpc/grpc-js/src/constants'
import {StatusCodes as httpStatus} from 'http-status-codes'

// 该方式是 grpc-getaway 库的转换方式.
// 转换 http 状态码到 gRPC 状态码
// https://github.com/grpc-ecosystem/grpc-gateway/blob/master/runtime/errors.go#L15
// See: https://github.com/googleapis/googleapis/blob/master/google/rpc/code.proto

// 下面这三种 code 都会转换成 httpStatus.CONFLICT
// 这里接收到 409 将会只转换为 status.ABORTED（10）
// status.ALREADY_EXISTS
// status.ABORTED

// 下面这三种 code 都会转换成 httpStatus.BAD_REQUEST
// 这里接收到 400 将会只转换为 status.INVALID_ARGUMENT（3）
// status.INVALID_ARGUMENT
// status.FAILED_PRECONDITION
// status.OUT_OF_RANGE

// 下面这三种 code 都会转换成 httpStatus.INTERNAL_SERVER_ERROR
// 未在上面定义转换的 code 也都会转换为 httpStatus.INTERNAL_SERVER_ERROR
// 这里接收到 500 将会只转换为 status.INTERNAL（13）
// status.INTERNAL
// status.UNKNOWN
// status.DATA_LOSS
export function httpStatus2GrpcStatus(code: httpStatus): Status {
  switch (code) {
    case httpStatus.OK:
      return status.OK
    case httpStatus.REQUEST_TIMEOUT:
      return status.CANCELLED
    case httpStatus.INTERNAL_SERVER_ERROR:
      return status.INTERNAL
    case httpStatus.GATEWAY_TIMEOUT:
      return status.DEADLINE_EXCEEDED
    case httpStatus.NOT_FOUND:
      return status.NOT_FOUND
    case httpStatus.FORBIDDEN:
      return status.PERMISSION_DENIED
    case httpStatus.UNAUTHORIZED:
      return status.UNAUTHENTICATED
    case httpStatus.TOO_MANY_REQUESTS:
      return status.RESOURCE_EXHAUSTED
    case httpStatus.BAD_REQUEST:
      return status.INVALID_ARGUMENT
    case httpStatus.CONFLICT:
      return status.ABORTED
    case httpStatus.NOT_IMPLEMENTED:
      return status.UNIMPLEMENTED
    case httpStatus.SERVICE_UNAVAILABLE:
      return status.UNAVAILABLE
  }
  return status.INTERNAL
}
