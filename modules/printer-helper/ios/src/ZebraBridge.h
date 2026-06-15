#import <Foundation/Foundation.h>
#import <CoreGraphics/CoreGraphics.h>

NS_ASSUME_NONNULL_BEGIN

@interface ZebraBridge : NSObject

+ (NSArray<NSString *> *)discoverPrintersWithTimeout:(NSInteger)timeoutMs;

// Without NS_SWIFT_NAME, Swift's "omit needless words" importer renames this to
// print(_:toIp:port:) (the "Image" base-name word is dropped because the first
// parameter is an image), making `ZebraBridge.printImage(...)` unavailable from
// Swift. Pin the imported name so the Swift call site stays explicit.
+ (nullable NSString *)printImage:(CGImageRef)image
                             toIp:(NSString *)ip
                             port:(NSInteger)port
    NS_SWIFT_NAME(printImage(_:toIp:port:));

@end

NS_ASSUME_NONNULL_END
