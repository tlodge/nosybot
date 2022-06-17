import cv2

im = cv2.imread('/home/tlodge/nosybot/server/images/phone_1655311257535.jpg')
frame_HSV = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
frame_threshold = cv2.inRange(frame_HSV, (0, 0, 101), (180, 255, 255))
contours, hierarchy = cv2.findContours(frame_threshold,cv2.RETR_LIST,cv2.CHAIN_APPROX_SIMPLE)[-2:]
idx =0 
maxarea = 0
maxcont = [] 
for cnt in contours:
    idx += 1
    x,y,w,h = cv2.boundingRect(cnt)
    #print(x,y,w,h)
    roi=im[y:y+h,x:x+w]
    #cv2.imwrite(str(idx) + '.jpg', roi)
    if (x != 0  and y != 0):
      a = cv2.contourArea( cnt);   
      if maxarea < a:
        maxarea = a
        maxcont = cnt

x,y,w,h = cv2.boundingRect(maxcont)
print ((x,y,w,h))
cv2.rectangle(im,(x,y),(x+w,y+h),(200,0,0),2)
cv2.imshow('img',im)
cv2.waitKey(0)    
