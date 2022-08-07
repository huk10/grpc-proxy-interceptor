#!/bin/bash

PROTO_DIR=./proto
OUT_DIR=./genproto
API_OUT_DIR=./openapi

function checkDirAndMake(){
  if [ -e "$1" ]; then
    rm -rf "$1";
  fi
  mkdir "$1"
}


checkDirAndMake $OUT_DIR
checkDirAndMake $API_OUT_DIR

protoc --proto_path=$PROTO_DIR \
         --go_out=$OUT_DIR \
         --go_opt=paths=source_relative \
         --go-grpc_out=$OUT_DIR \
         --go-grpc_opt=paths=source_relative \
         --grpc-gateway_out=$OUT_DIR \
         --grpc-gateway_opt=paths=source_relative \
         --grpc-gateway_opt=generate_unbound_methods=true \
         --openapiv2_out=$API_OUT_DIR \
         --openapiv2_opt include_package_in_tags=true,openapi_naming_strategy=fqn \
         greeter/v1/services/greeter.proto


