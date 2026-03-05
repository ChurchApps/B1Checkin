require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'PrinterHelper'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.author         = 'ChurchApps'
  s.homepage       = 'https://github.com/ChurchApps/B1Checkin'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = 'src/**/*.{swift}'
  s.vendored_frameworks = 'Frameworks/BRLMPrinterKit.xcframework'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }
end
