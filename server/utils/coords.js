const limitY = (y)=>{
    return y;//Math.max(-82,y)
}

const limitX = (x)=>{
    return x;//Math.max(-65,x);
}

export const deltaY = (x,y)=>{   
    if (x <= 13)  return limitY(-95 + Math.floor((x/13)*5)); //13-0
    if (x <= 43)  return limitY(-90 + Math.floor(((x-13)/30)*10)); //43-13
    if (x <= 78)  return limitY(-80 + Math.floor(((x-43)/35)*10)); //78-43
    if (x <= 116) return limitY(-70 + Math.floor(((x-78)/38)*10)); //116-78
    if (x <= 154) return limitY(-60 + Math.floor(((x-116)/38)*10)); //154-116
    if (x <= 192) return limitY(-50 + Math.floor(((x-154)/38)*10)); //192-154
    if (x <= 235) return limitY(-40 + Math.floor(((x-192)/43)*10)); //235-192
    if (x <= 276) return limitY(-30 + Math.floor(((x-235)/41)*10)); //276-235
    if (x <= 319) return limitY(-20 + Math.floor(((x-276)/43)*10)); //319-276
    if (x <= 361) return limitY(-10 + Math.floor(((x-319)/41)*10)); //361-319
    if (x <= 404) return limitY(0 +   Math.floor(((x-361)/42)*10)); //404-361
    if (x <= 445) return limitY(10 +  Math.floor(((x-404)/41)*10)); //445-404
    if (x <= 483) return limitY(20 +  Math.floor(((x-445)/38)*10)); //483-445
    if (x <= 521) return limitY(30 +  Math.floor(((x-483)/38)*10)); //521-483  
    if (x <= 557) return limitY(40 +  Math.floor(((x-521)/36)*10)); //557-521  
    if (x <= 591) return limitY(52 +  Math.floor(((x-557)/34)*10)); //591-557
    if (x <= 624) return limitY(60 +  Math.floor(((x-591)/33)*10)); //624-591
    if (x > 624)  return limitY(70 +  Math.floor(((x-624)/15)*6));  //639-624
}

export const deltaX = (x,y)=>{  
    if (y >  346) return 21;
    if (y >= 309) return limitX(10  + Math.floor(((y-309)/37)*10)); //346-309
    if (y >= 269) return limitX(0   + Math.floor(((y-269)/40)*10)); //309-269
    if (y >= 230) return limitX(-8   + Math.floor(((y-230)/39)*10));//269-230
    if (y >= 191) return limitX(-18   + Math.floor(((y-191)/39)*10));//230-191
    if (y >= 153) return limitX(-30   + Math.floor(((y-153)/38)*10));//191-153
    if (y >= 115) return limitX(-38   + Math.floor(((y-115)/38)*10));//153-115
    if (y >= 76)  return limitX(-48   + Math.floor(((y-76)/39)*10));//115-76
    if (y >= 42)  return limitX(-58   + Math.floor(((y-42)/34)*10));//76-42
    if (y < 42)    return limitX(-68   + Math.floor(((y-7)/35)*10));//42-7
}