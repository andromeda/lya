# Lya Requirements

Lya should work with most Node.js versions, but is tested with __nodejs 8.9.4__. 
You can either use the preconfigured **lya docker container** or you can use the manual way to install 
the correct node.js version. The best way to install the recommended Node.js version, is to use [nvm](https://github.com/nvm-sh/nvm).

### Quick install of nvm

To **install** or **update** nvm, you should run the install script. To do that, you may either download 
and run the script manually, or use the following cURL or Wget command:
```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
```
```sh
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
```

Running either of the above commands downloads a script and runs it. The script clones the nvm repository to `~/.nvm`, 
and attempts to add the source lines from the snippet below to the correct profile file (`~/.bash_profile`, `~/.zshrc`, `~/.profile`, or `~/.bashrc`).

<a id="profile_snippet"></a>
```sh
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
```

### Change to version 8.9.4

To change your Node.js version you need to execute the following commands.
```sh
nvm ls # To check the existing node.js versions on pc
nvm install 8.9.4
nvm use 8.9.4
```
