package main

import (
	"context"
	greeter "example/genproto/greeter/v1/services"
	greeterV2 "example/genproto/greeter/v2/services"
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

type GreeterV2 struct {
	greeterV2.UnimplementedGreeterServer
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
	// grpc.SetTrailer 和 grpc.SetHeader 都是设置metadata的方法，但是这两种方式的 Metadata 客户端获取的方式不同，不是在同一个位置
	md := metadata.New(request.Metadata)
	err := grpc.SetHeader(ctx, md)
	return &emptypb.Empty{}, err
}

func (g Greeter) Trailer(ctx context.Context, request *greeter.MetadataRequest) (*emptypb.Empty, error) {
	// Trailer 会存在grpc.Status 中
	err := grpc.SetTrailer(ctx, metadata.New(request.Metadata))
	return &emptypb.Empty{}, err
}

func (g Greeter) Status(ctx context.Context, request *greeter.StatusRequest) (*emptypb.Empty, error) {
	_ = grpc.SetTrailer(ctx, metadata.New(map[string]string{"buf": "buffer"}))
	return &emptypb.Empty{}, status.New(codes.Code(request.Status), request.ErrorMsg).Err()
}

// v2 版使用 grpc+web+json 调用，方法是相同的。。

func (g GreeterV2) SayHello(ctx context.Context, request *greeterV2.HelloRequest) (*greeterV2.HelloReply, error) {
	var result = new(greeterV2.HelloReply)
	result.Message = "hello " + request.Name
	return result, nil
}

func (g GreeterV2) EqMetadata(ctx context.Context, request *greeterV2.MetadataRequest) (*greeterV2.EqMetadataResponse, error) {
	// 简单点，不判断那么仔细了
	md, _ := metadata.FromIncomingContext(ctx)
	for k, v := range request.Metadata {
		val, found := md[k]
		if !found {
			return &greeterV2.EqMetadataResponse{Ok: false}, nil
		}
		if v != val[0] {
			return &greeterV2.EqMetadataResponse{Ok: false}, nil
		}
	}
	return &greeterV2.EqMetadataResponse{Ok: true}, nil
}

func (g GreeterV2) Metadata(ctx context.Context, request *greeterV2.MetadataRequest) (*emptypb.Empty, error) {
	// grpc.SetTrailer 和 grpc.SetHeader 都是设置metadata的方法，但是这两种方式的 Metadata 客户端获取的方式不同，不是在同一个位置
	md := metadata.New(request.Metadata)
	err := grpc.SetHeader(ctx, md)
	return &emptypb.Empty{}, err
}

func (g GreeterV2) Trailer(ctx context.Context, request *greeterV2.MetadataRequest) (*emptypb.Empty, error) {
	// Trailer 会存在grpc.Status 中
	err := grpc.SetTrailer(ctx, metadata.New(request.Metadata))
	return &emptypb.Empty{}, err
}

func (g GreeterV2) Status(ctx context.Context, request *greeterV2.StatusRequest) (*emptypb.Empty, error) {
	_ = grpc.SetTrailer(ctx, metadata.New(map[string]string{"buf": "buffer"}))
	return &emptypb.Empty{}, status.New(codes.Code(request.Status), request.ErrorMsg).Err()
}

func main() {
	lis, err := net.Listen("tcp", GrpcAddr)

	if err != nil {
		log.Panicf("failed to listen: %v", err)
	}

	grpcServer := grpc.NewServer()

	greeter.RegisterGreeterServer(grpcServer, &Greeter{})
	greeterV2.RegisterGreeterServer(grpcServer, &GreeterV2{})

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
	err = greeterV2.RegisterGreeterHandlerFromEndpoint(ctx, mux, grpcServerEndpoint, opts)
	if err != nil {
		return err
	}
	// Start HTTP server (and proxy calls to gRPC server endpoint)
	fmt.Printf("run grpc http proxy server in %s \n", HttpAddr)
	return http.ListenAndServe(HttpAddr, mux)
}
