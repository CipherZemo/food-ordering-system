const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold mb-4">🍕 FoodHub</h3>
            <p className="text-gray-400">
              Delicious food delivered fresh to your door. Order online and enjoy!
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-gray-400 hover:text-white transition">
                  Menu
                </a>
              </li>
              <li>
                <a href="/orders" className="text-gray-400 hover:text-white transition">
                  My Orders
                </a>
              </li>
              <li>
                <a href="/profile" className="text-gray-400 hover:text-white transition">
                  Profile
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xl font-bold mb-4">Contact Us</h3>
            <p className="text-gray-400">Email: support@foodhub.com</p>
            <p className="text-gray-400">Phone: (555) 123-4567</p>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400">
          <p>&copy; 2024 FoodHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;