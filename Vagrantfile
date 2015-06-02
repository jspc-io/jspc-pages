# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure(2) do |config|
  config.vm.box = "hfm4/centos7"

  config.vm.synced_folder ".", "/vagrant", type: "nfs"
  config.vm.synced_folder ENV.fetch('PROJECTS_DIR', File.join(ENV['HOME'], 'projects')), '/projects', type: 'nfs'
  config.ssh.forward_agent = true

  config.vm.define 'pages' do |mach|
    mach.vm.hostname = 'jspc.me'
    mach.vm.network 'private_network', ip: '30.31.32.33'
  end

end
