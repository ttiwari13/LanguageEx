const jwt=require("jsonwebtoken");

const protect= function(req,res,next){
    try{
      const authHeader=req.headers["authorization"];
      console.log('Auth header received:', authHeader);
      if(!authHeader){
        return res.status(401).json({ message: "No token provided" });
      }
      const token=authHeader.split(" ")[1];
      console.log('Extracted token:', token);
      if(!token){
         return res.status(401).json({ message: "Invalid token format" });
      }
      const decoded=jwt.verify(token,process.env.JWT_SECRET);
      console.log('Token decoded successfully:', decoded);
        req.user = decoded;
        next();
    }
    catch(error){
         console.error("Auth Middleware Error:", error.message);
    return res.status(403).json({ message: "Invalid or expired token" });
    }
}

module.exports= protect;