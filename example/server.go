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
  // Trailer 会存在grpc.Status 中
  err := grpc.SetTrailer(ctx, metadata.New(map[string]string{"buf": "buffer"}))
  err = grpc.SetHeader(ctx, metadata.New(map[string]string{"buf": "buffer"}))
	return result, err
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
