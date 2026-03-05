import Foundation
import UIKit

protocol PrintProviderProtocol {
    var brand: String { get }
    var status: String { get }
    var onError: ((_ source: String, _ message: String) -> Void)? { get set }
    var onEvent: ((_ eventType: String, _ source: String, _ message: String) -> Void)? { get set }
    func scan() -> [String]
    func checkInit(ip: String, model: String)
    func configure()
    func printImages(_ imageURIs: [String])
}
