#import <Foundation/Foundation.h>
#import <CoreGraphics/CoreGraphics.h>

NS_ASSUME_NONNULL_BEGIN

@interface ZebraBridge : NSObject

+ (NSArray<NSString *> *)discoverPrintersWithTimeout:(NSInteger)timeoutMs;

+ (nullable NSString *)printImage:(CGImageRef)image
                             toIp:(NSString *)ip
                             port:(NSInteger)port;

@end

NS_ASSUME_NONNULL_END
