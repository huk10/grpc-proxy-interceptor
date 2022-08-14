package main

import (
	"context"
	"example2/genproto"
	"fmt"
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/reflection"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"
	"log"
	"net"
	"net/http"
)

const (
	HttpAddr = ":4501"
	GrpcAddr = ":9091"
)

type Greeter struct {
	greeter.UnimplementedGreeterServer
}

func (g Greeter) SayHello(ctx context.Context, request *greeter.HelloRequest) (*greeter.HelloReply, error) {
	var result = new(greeter.HelloReply)
	result.Message = "hello " + request.Name
	return result, nil
}

func (g Greeter) EqMetadata(ctx context.Context, request *greeter.MetadataRequest) (*greeter.EqMetadataResponse, error) {
	// 简单点，不判断那么仔细了
	md, _ := metadata.FromIncomingContext(ctx)
	for k, v := range request.Metadata {
		val, found := md[k]
		if !found {
			return &greeter.EqMetadataResponse{Ok: false}, nil
		}
		if v != val[0] {
			return &greeter.EqMetadataResponse{Ok: false}, nil
		}
	}
	return &greeter.EqMetadataResponse{Ok: true}, nil
}

func (g Greeter) Metadata(ctx context.Context, request *greeter.MetadataRequest) (*emptypb.Empty, error) {
	// 这里使用 grpc.SetTrailer 和 grpc.SetHeader 是一样的，在一元 RPC 模式下，这两种方式的 Metadata 都是同时到达客户端的
	err := grpc.SetHeader(ctx, metadata.New(request.Metadata))
	fmt.Printf("metadata: %+v \n", request.Metadata)
	return &emptypb.Empty{}, err
}

func (g Greeter) Status(ctx context.Context, request *greeter.StatusRequest) (*emptypb.Empty, error) {
	fmt.Printf("%v \n", status.New(codes.Code(request.Status), request.ErrorMsg).Err())
	err := grpc.SetHeader(ctx, metadata.Pairs("hello", "buffer"))
	if err != nil {
		return nil, err
	}
	return &emptypb.Empty{}, status.New(codes.Code(request.Status), request.ErrorMsg).Err()
}

func main() {
	lis, err := net.Listen("tcp", GrpcAddr)

	if err != nil {
		log.Panicf("failed to listen: %v", err)
	}

	grpcServer := grpc.NewServer()

	greeter.RegisterGreeterServer(grpcServer, &Greeter{})

	reflection.Register(grpcServer)

	go func() {
		fmt.Printf("run grpc server in %s \n", GrpcAddr)
		if err := grpcServer.Serve(lis); err != nil {
			log.Fatalf("failed to grpc serve: %v\n", err)
		}
	}()

	if err := RunGrpcHttpGateway(GrpcAddr); err != nil {
		log.Panicf("failed to gateway serve: %v\n", err)
	}
}

func RunGrpcHttpGateway(grpcServerEndpoint string) error {
	ctx := context.Background()
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	mux := runtime.NewServeMux()
	opts := []grpc.DialOption{grpc.WithTransportCredentials(insecure.NewCredentials())}
	err := greeter.RegisterGreeterHandlerFromEndpoint(ctx, mux, grpcServerEndpoint, opts)
	if err != nil {
		return err
	}
	// Start HTTP server (and proxy calls to gRPC server endpoint)
	fmt.Printf("run grpc http proxy server in %s \n", HttpAddr)
	return http.ListenAndServe(HttpAddr, mux)
}
