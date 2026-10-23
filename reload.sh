 #!/bin/bash

pnpm run build
sudo rm -r /home/$USER/homebrew/plugins/FanControlFork/
sudo cp -r /home/$USER/Development/FanControlFork/ ~/homebrew/plugins/
sudo systemctl restart plugin_loader.service
