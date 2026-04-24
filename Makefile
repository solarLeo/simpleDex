RPC_URL ?= http://127.0.0.1:8545

.PHONY: build test fmt anvil deploy-local deploy-network

build:
	forge build

test:
	forge test -vvv

fmt:
	forge fmt

anvil:
	anvil

deploy-local:
	forge script script/DeploySimpleDex.s.sol:DeploySimpleDex --rpc-url $(RPC_URL) --broadcast -vvv

deploy-network:
	forge script script/DeploySimpleDex.s.sol:DeploySimpleDex --rpc-url $(RPC_URL) --broadcast -vvv
