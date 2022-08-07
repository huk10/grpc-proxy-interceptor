package main

import (
	"context"
	greeter "example/genproto/greeter/v1/services"
	"fmt"
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/reflection"
	"google.golang.org/grpc/status"
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
	if request.Name == "" {
		return nil, status.Error(codes.InvalidArgument, "please input you name")
	}
	var result = new(greeter.HelloReply)
	result.Message = "hello " + request.Name
	if md, ok := metadata.FromIncomingContext(ctx); ok {
		fmt.Printf("metadata: %v \n", md)
	}
	header := metadata.Pairs("header-key", "val")
	err := grpc.SendHeader(ctx, header)
	if err != nil {
		return nil, err
	}
	trailer := metadata.Pairs("trailer-key", "val")
	err = grpc.SetTrailer(ctx, trailer)
	if err != nil {
		return nil, err
	}
	// header和trailer的接收时机不同，可以看出，在一元模式中，header和trailer是一起到达客户端的，此时客户端从header或者trailer中获取 metadata 是一样的，但是在流模式中，header是先到达，然后接收多个stream内容，最后才获取到trailer，获取的时机是不一样的，所以 grpc 提供了两种方式让我们发送 metadata
	return result, nil
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
