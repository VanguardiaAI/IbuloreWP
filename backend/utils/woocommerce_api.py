from woocommerce import API
from config import Config

def get_wc_api():
    """
    Initializes and returns the WooCommerce API client.
    """
    if not all([Config.WC_STORE_URL, Config.WC_CONSUMER_KEY, Config.WC_CONSUMER_SECRET]):
        raise ValueError("WooCommerce API credentials are not fully configured.")

    return API(
        url=Config.WC_STORE_URL,
        consumer_key=Config.WC_CONSUMER_KEY,
        consumer_secret=Config.WC_CONSUMER_SECRET,
        version="wc/v3"
    ) 