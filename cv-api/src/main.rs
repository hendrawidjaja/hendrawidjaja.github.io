use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use dotenv::dotenv;
use std::collections::HashMap;

fn load_route_keys() -> HashMap<String, String> {
    dotenv().ok();
    let mut map = HashMap::new();
    if let Ok(read) = std::env::var("API_KEY_READ") {
        map.insert("read".to_string(), read);
    }
    if let Ok(write) = std::env::var("API_KEY_WRITE") {
        map.insert("write".to_string(), write);
    }
    if let Ok(auth) = std::env::var("API_KEY_AUTH") {
        map.insert("auth".to_string(), auth);
    }
    map
}

async fn index() -> HttpResponse {
    HttpResponse::Ok().body("ok")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();

    let route_keys = load_route_keys();
    println!("API keys: auth={:?}, read={:?}, write={:?}", 
        route_keys.get("auth"), route_keys.get("read"), route_keys.get("write"));

    HttpServer::new(move || {
        App::new()
            .data(load_route_keys())
            .route("/api", web::get().to(index))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}