
GIT_HASH=$(git rev-parse --short HEAD)

echo "Building ling-sysint:$GIT_HASH"

# ccr.ccs.tencentyun.com/ling-default-1/ling-sysint
podman buildx build --platform linux/amd64 -t ccr.ccs.tencentyun.com/ling-default-1/ling-sysint:$GIT_HASH -f Dockerfile .
podman push ccr.ccs.tencentyun.com/ling-default-1/ling-sysint:$GIT_HASH

