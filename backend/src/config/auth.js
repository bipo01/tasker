import jwt from "jsonwebtoken";

export function auth(req, res, next) {
	const token = req.cookies.token;

	if (!token) return res.status(401).json({ message: "Token missing" });

	jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
		if (err) return res.status(401).json({ message: "Invalid token" });

		req.user = decoded;
		next();
	});
}

export function signUser(req, res, user) {
	const token = jwt.sign(
		{
			id: user.id,
			name: user.name,
			email: user.email,
			username: user.username,
		},
		process.env.JWT_SECRET,
		{ expiresIn: "1d" },
	);

	res.cookie("token", token, { httpOnly: true });
}
