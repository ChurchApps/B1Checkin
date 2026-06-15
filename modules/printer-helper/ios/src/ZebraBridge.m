#import "ZebraBridge.h"
#import "NetworkDiscoverer.h"
#import "DiscoveredPrinter.h"
#import "TcpPrinterConnection.h"
#import "ZebraPrinter.h"
#import "ZebraPrinterFactory.h"
#import "GraphicsUtil.h"

@implementation ZebraBridge

+ (NSArray<NSString *> *)discoverPrintersWithTimeout:(NSInteger)timeoutMs {
    NSError *error = nil;
    NSArray *printers = [NetworkDiscoverer localBroadcastWithTimeout:timeoutMs error:&error];
    if (error != nil || printers == nil) {
        return @[];
    }
    NSMutableArray<NSString *> *result = [NSMutableArray array];
    for (DiscoveredPrinter *p in printers) {
        if (p.address.length > 0) {
            [result addObject:p.address];
        }
    }
    return result;
}

+ (NSString *)printImage:(CGImageRef)image toIp:(NSString *)ip port:(NSInteger)port {
    if (ip.length == 0) {
        return @"No printer IP";
    }
    TcpPrinterConnection *connection = [[TcpPrinterConnection alloc] initWithAddress:ip andWithPort:port];
    if (![connection open]) {
        return [NSString stringWithFormat:@"Could not connect to %@", ip];
    }
    NSError *error = nil;
    id<ZebraPrinter, NSObject> printer = [ZebraPrinterFactory getInstance:connection error:&error];
    if (error != nil || printer == nil) {
        [connection close];
        return error.localizedDescription ?: @"Failed to create printer instance";
    }
    BOOL success = [[printer getGraphicsUtil]
                    printImage:image
                    atX:0
                    atY:0
                    withWidth:(NSInteger)CGImageGetWidth(image)
                    withHeight:(NSInteger)CGImageGetHeight(image)
                    andIsInsideFormat:NO
                    error:&error];
    [connection close];
    if (!success || error != nil) {
        return error.localizedDescription ?: @"Print failed";
    }
    return nil;
}

@end
