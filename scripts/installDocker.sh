#!/usr/bin/env bash
set -euo pipefail

if [ "$EUID" -ne 0 ]; then
	echo "Please run as root"
	exit
fi

if [[ "$(which docker)" != "" ]]; then
	echo "$(docker -v)"
	exit
fi

apt -y install \
	apt-transport-https \
	ca-certificates \
	curl \
	gnupg-agent \
	software-properties-common

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -

apt-key fingerprint 0EBFCD88

add-apt-repository \
	"deb [arch=amd64] https://download.docker.com/linux/ubuntu \
	$(lsb_release -cs) \
	stable"

apt update
apt -y install \
	docker-ce \
	docker-ce-cli \
	containerd.io

usermod -aG docker "$SUDO_USER"

echo "docker installed successfully"
echo "Please logout and login for changes to take effect"

